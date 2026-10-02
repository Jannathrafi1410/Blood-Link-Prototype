import React, { useState, useEffect } from 'react';
import { Hospital, BloodBank, PincodeRecord } from '../types';
import { api } from '../services/api';
import { MapView } from '../components/MapView';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { PrivacyNotice } from '../components/PrivacyNotice';
import {
  Search,
  MapPin,
  Building2,
  Droplet,
  ShieldCheck,
  AlertCircle,
  Navigation
} from 'lucide-react';

export const NationalMapPage: React.FC = () => {
  const [pincodeInput, setPincodeInput] = useState('680001');
  const [currentPincode, setCurrentPincode] = useState<PincodeRecord | null>(null);
  const [center, setCenter] = useState<[number, number]>([10.5276, 76.2144]);
  const [hospitals, setHospitals] = useState<Array<Hospital & { distanceKm: number }>>([]);
  const [bloodBanks, setBloodBanks] = useState<Array<BloodBank & { distanceKm: number; inventorySummary: string }>>([]);
  const [donorZones, setDonorZones] = useState<any[]>([]);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchPincode = async (pin: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const pInfo = await api.lookupPincode(pin);
      setCurrentPincode(pInfo);
      setCenter([pInfo.lat, pInfo.lng]);

      const [hosps, banks, zones] = await Promise.all([
        api.getNearbyHospitals(pin),
        api.getNearbyBanks(pin),
        api.getDonorZones()
      ]);
      setHospitals(hosps);
      setBloodBanks(banks);
      setDonorZones(zones);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pincode not found. Enter a valid 6-digit Indian PIN code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearchPincode('680001');
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Pincode Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>National Blood Availability & Transfusion Grid</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Location-aware PostGIS proximity search across hospitals, authorized blood banks, and anonymous donor zones
            </p>
          </div>

          {/* Quick Pincode Switcher Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px]">Quick Jump:</span>
            {[
              { label: 'Thrissur', pin: '680001' },
              { label: 'Kochi', pin: '682001' },
              { label: 'Bengaluru', pin: '560001' },
              { label: 'Mumbai', pin: '400001' },
              { label: 'Delhi', pin: '110001' }
            ].map(item => (
              <button
                key={item.pin}
                onClick={() => {
                  setPincodeInput(item.pin);
                  handleSearchPincode(item.pin);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  pincodeInput === item.pin
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearchPincode(pincodeInput);
          }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              maxLength={6}
              value={pincodeInput}
              onChange={e => setPincodeInput(e.target.value.trim())}
              placeholder="Enter 6-digit Indian PIN code (e.g. 680001, 110001, 560001)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-red-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={radius}
              onChange={e => setRadius(parseInt(e.target.value) || 5)}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="5">5 km Search Wave</option>
              <option value="10">10 km Escalation Wave</option>
              <option value="25">25 km District Tier</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors shrink-0"
            >
              {loading ? 'Locating...' : 'Search Grid'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {currentPincode && (
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 pt-1">
            <Navigation className="w-3.5 h-3.5 text-red-600" />
            <span>
              Active Area Centroid: <strong>{currentPincode.officeName}</strong>, {currentPincode.district},{' '}
              {currentPincode.state} (PIN {currentPincode.pincode})
            </span>
          </div>
        )}
      </div>

      {/* Interactive Map & Fallback View */}
      <MapView
        center={center}
        zoom={12}
        hospitals={hospitals}
        bloodBanks={bloodBanks}
        donorZones={donorZones}
        selectedRadiusKm={radius}
      />

      {/* Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrivacyNotice />
        <MedicalDisclaimer />
      </div>
    </div>
  );
};
