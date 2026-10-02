import React, { useState, useEffect } from 'react';
import { User, UserRole, EmergencyRequest } from './types';
import { api, getStoredUser, setSessionExpiredListener } from './services/api';
import { Navbar } from './components/Navbar';
import { WelcomeLoginPage } from './components/WelcomeLoginPage';
import { EmergencyModal } from './components/EmergencyModal';
import { SecurityArchitectureModal } from './components/SecurityArchitectureModal';
import { DemoTourBar } from './components/DemoTourBar';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { DonorDashboard } from './pages/DonorDashboard';
import { BloodBankDashboard } from './pages/BloodBankDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { NssDashboard } from './pages/NssDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NationalMapPage } from './pages/NationalMapPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { Heart, ShieldCheck, Activity, PhoneCall, AlertTriangle, Lock } from 'lucide-react';

export const App: React.FC = () => {
  // Check stored user from session or start at Welcome screen
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('hospital');
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto sign-out listener on token expiry (401 HTTP response)
  useEffect(() => {
    setSessionExpiredListener(() => {
      setCurrentUser(null);
      setIsGuestBrowsing(false);
      showToast('Your session has expired. Please sign in again.');
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleRoleChange = async (newRole: UserRole) => {
    try {
      const res = await api.login(undefined, newRole);
      setCurrentUser(res.user);
      if (newRole === 'HOSPITAL') setActiveTab('hospital');
      else if (newRole === 'DONOR') setActiveTab('donor');
      else if (newRole === 'BLOOD_BANK') setActiveTab('blood-bank');
      else if (newRole === 'PATIENT') setActiveTab('patient');
      else if (newRole === 'NSS_PARTNER') setActiveTab('nss');
      else if (newRole === 'ADMIN') setActiveTab('admin');

      showToast(`Switched active view to ${res.user.name} (${newRole})`);
    } catch (err: any) {
      showToast(err.message || 'Failed to switch demo persona.');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsGuestBrowsing(false);
    if (user.role === 'HOSPITAL') setActiveTab('hospital');
    else if (user.role === 'DONOR') setActiveTab('donor');
    else if (user.role === 'BLOOD_BANK') setActiveTab('blood-bank');
    else if (user.role === 'PATIENT') setActiveTab('patient');
    else if (user.role === 'NSS_PARTNER') setActiveTab('nss');
    else if (user.role === 'ADMIN') setActiveTab('admin');
    else setActiveTab('hospital');

    showToast(`Welcome, ${user.name}! Authenticated as ${user.role}.`);
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setIsGuestBrowsing(false);
    showToast('Signed out successfully. Session closed.');
  };

  const handleRequestCreated = (req: EmergencyRequest) => {
    showToast(`Emergency SOS ${req.id} dispatched! Status: ${req.status}`);
  };

  // If visitor is not authenticated and not explicitly browsing guest public map, show Welcome/Login Screen
  if (!currentUser && !isGuestBrowsing) {
    return (
      <>
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slide-up">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        <WelcomeLoginPage
          onLoginSuccess={handleLoginSuccess}
          onExploreGuestMap={() => {
            setIsGuestBrowsing(true);
            setActiveTab('map');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slide-up">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guest Mode Banner if user is exploring map without sign-in */}
      {!currentUser && isGuestBrowsing && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
              GUEST EXPLORER MODE
            </span>
            <span>You are viewing public availability and the national pincode map.</span>
          </div>
          <button
            onClick={() => setIsGuestBrowsing(false)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Sign In / Choose Persona
          </button>
        </div>
      )}

      {/* Interactive Clinical Tour Bar (Available in demo environment) */}
      {currentUser && (
        <DemoTourBar
          onSelectRole={handleRoleChange}
          onRefreshData={() => {
            showToast('Thrissur demo scenario refreshed across all nodes.');
          }}
          onRequestViewChange={() => {
            setActiveTab('hospital');
          }}
        />
      )}

      {/* Persistent Full-Stack Navbar */}
      {currentUser && (
        <Navbar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSosModal={() => setIsSosModalOpen(true)}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onSignOut={handleSignOut}
          unreadCount={notificationCount}
        />
      )}

      {/* Main Dynamic View */}
      <main className="flex-1">
        {activeTab === 'hospital' && currentUser && (
          <HospitalDashboard onOpenSosModal={() => setIsSosModalOpen(true)} />
        )}
        {activeTab === 'donor' && currentUser && <DonorDashboard />}
        {activeTab === 'blood-bank' && currentUser && <BloodBankDashboard />}
        {activeTab === 'patient' && currentUser && (
          <PatientDashboard onOpenSosModal={() => setIsSosModalOpen(true)} />
        )}
        {activeTab === 'nss' && currentUser && <NssDashboard />}
        {activeTab === 'admin' && currentUser && <AdminDashboard />}
        {activeTab === 'map' && <NationalMapPage />}
        {activeTab === 'notifications' && currentUser && <NotificationsPage />}
      </main>

      {/* Emergency SOS Broadcast Modal */}
      {currentUser && (
        <EmergencyModal
          isOpen={isSosModalOpen}
          onClose={() => setIsSosModalOpen(false)}
          currentUserRole={currentUser.role}
          onRequestCreated={handleRequestCreated}
        />
      )}

      {/* Security Architecture & Cryptography Modal */}
      <SecurityArchitectureModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUserRole={currentUser?.role}
      />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9">
                <img
                  src="/src/assets/mascot.svg"
                  alt="Blood Availability Network"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-sm tracking-tight">
                  BLOOD AVAILABILITY NETWORK
                </span>
                <p className="text-[11px] text-slate-500">
                  The right blood, to the right patient, at the right time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px]">
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Donor Contact Exposure Guaranteed</span>
              </button>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-4 h-4 text-red-500" />
                <span>Bank-First Matching Engine Active</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <PhoneCall className="w-4 h-4 text-blue-500" />
                <span>National Emergency: 108 / 104</span>
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl text-[11px] text-slate-400 border border-slate-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Healthcare Prototype Disclaimer:</strong> This application demonstrates privacy-preserving emergency logistics, coarse location masking, and authenticated encryption. Simulated OTP challenges, demo encryption keys, and indicative eligibility declarations do not constitute legal identification or clinical clearance. Actual blood donation requires on-site screening by licensed medical staff.
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Blood Availability Network. Built for life-critical healthcare logistics.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="hover:text-emerald-400 transition-colors"
              >
                Security & Privacy Architecture
              </button>
              <span>·</span>
              <button
                onClick={() => setActiveTab('map')}
                className="hover:text-slate-300 transition-colors"
              >
                Pincode Registry
              </button>
              <span>·</span>
              <button
                onClick={handleSignOut}
                className="hover:text-red-400 transition-colors"
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
