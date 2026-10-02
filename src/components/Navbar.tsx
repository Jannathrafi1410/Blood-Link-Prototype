import React from 'react';
import { User, UserRole } from '../types';
import { Mascot } from './Mascot';
import {
  Siren,
  MapPin,
  Bell,
  ShieldCheck,
  Building2,
  Droplet,
  Users,
  Settings,
  Heart,
  LogOut,
  Lock,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSosModal: () => void;
  onOpenSecurityModal: () => void;
  onSignOut: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  activeTab,
  setActiveTab,
  onOpenSosModal,
  onOpenSecurityModal,
  onSignOut,
  unreadCount = 1
}) => {
  const navItems = [
    { id: 'hospital', label: 'Hospital', icon: Building2, role: 'HOSPITAL' },
    { id: 'donor', label: 'Donor Desk', icon: Heart, role: 'DONOR' },
    { id: 'blood-bank', label: 'Blood Bank', icon: Droplet, role: 'BLOOD_BANK' },
    { id: 'patient', label: 'Patient SOS', icon: Users, role: 'PATIENT' },
    { id: 'nss', label: 'NSS Partner', icon: Users, role: 'NSS_PARTNER' },
    { id: 'map', label: 'National Map', icon: MapPin },
    { id: 'admin', label: 'Admin Console', icon: Settings, role: 'ADMIN' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Emergency Utility Bar */}
      <div className="bg-slate-950 text-white px-4 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-red-400 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            Live Network Active
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-300 hidden sm:inline">
            Bank-First Allocation & Zero-PII Candidate Relay Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Security & Cryptography Spec Link */}
          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Privacy & Encryption Spec</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Session Token Status */}
          <span className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Session: Active (2h TTL)</span>
          </span>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Demo Persona Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] hidden md:inline">Demo Switch:</span>
            <select
              value={currentUser.role}
              onChange={e => onRoleChange(e.target.value as UserRole)}
              className="bg-slate-800 border border-slate-700 text-white text-[11px] rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium cursor-pointer"
            >
              <option value="HOSPITAL">Dr. Thomas (Hospital Admin)</option>
              <option value="DONOR">Rahul Varma (Donor D-014)</option>
              <option value="BLOOD_BANK">Priya Nair (Blood Bank Admin)</option>
              <option value="PATIENT">Lakshmi Menon (Patient/Family)</option>
              <option value="NSS_PARTNER">Prof. Haridas (NSS User)</option>
              <option value="ADMIN">Main Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div
            onClick={() => setActiveTab('hospital')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 shrink-0">
              <img
                src="/src/assets/mascot.svg"
                alt="Blood Availability Network"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg flex items-center gap-1.5">
                <span>BLOOD AVAILABILITY NETWORK</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                The right blood, to the right patient, at the right time.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.role) onRoleChange(item.role as UserRole);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-red-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick SOS Trigger Button */}
            <button
              onClick={onOpenSosModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102 active:scale-98"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span>Broadcast SOS</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>

            {/* Current Active Persona Chip */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {currentUser.role} · {currentUser.verificationStatus || 'Verified'}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 text-xs font-semibold transition-colors"
              title="Terminate session and sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 text-xs no-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.role) onRoleChange(item.role as UserRole);
              }}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
