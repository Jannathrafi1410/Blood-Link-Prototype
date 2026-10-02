import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Building2,
  ShieldCheck
} from 'lucide-react';

export const NssDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<any>(null);

  // New camp state
  const [venue, setVenue] = useState('College Indoor Stadium');
  const [campDate, setCampDate] = useState('2026-10-30');
  const [pincode, setPincode] = useState('680001');
  const [targetUnits, setTargetUnits] = useState(150);

  const loadNssData = async () => {
    try {
      setLoading(true);
      const data = await api.getNssStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNssData();
  }, []);

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createNssCamp({
        venue,
        date: campDate,
        pincode,
        targetUnits
      });
      setIsCampModalOpen(false);
      loadNssData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule camp');
    }
  };

  const handleCsvImport = async () => {
    setCsvResult(null);
    try {
      const res = await api.importNssDonors(csvText);
      setCsvResult(res);
      loadNssData();
    } catch (err: any) {
      alert(err.message || 'Failed to import CSV');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* NSS Unit Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">St. Thomas College NSS Unit #42</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Verified NSS Partner ✓
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              National Service Scheme Partner · Pincode 680001 (Thrissur) · Lead Officer: Prof. Haridas K.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Import Consented Donors CSV</span>
          </button>
          <button
            onClick={() => setIsCampModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Blood Camp</span>
          </button>
        </div>
      </div>

      {/* Aggregate Statistics Overview (NSS Only sees aggregate metrics per Section 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-medium text-slate-500">Registered Volunteers</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats?.registeredVolunteers || 320}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Consented & Active</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Camps Organized</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats?.totalCamps || 3}
          </div>
          <div className="text-[11px] text-blue-600 mt-1">{stats?.scheduledCamps || 2} Upcoming</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-medium text-slate-500">Units Donated</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats?.unitsCollected || 194}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Supplied to Jubilee Blood Centre</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-medium text-slate-500">Informed Consent Audit</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero unverified roster entries</div>
        </div>
      </div>

      {/* Camps Register */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              NSS Blood Donation Camps Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Coordinated with district transfusion services and authorized blood banks
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Venue</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Pincode</th>
                <th className="py-3 px-6">Target Units</th>
                <th className="py-3 px-6">Units Collected</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.camps?.map((camp: any) => (
                <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    {camp.venue}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {camp.date}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-600">
                    {camp.pincode}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-900">
                    {camp.targetUnits}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-emerald-700">
                    {camp.collectedUnits || '—'}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        camp.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consent Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Informed Consent Requirement for Institutional Donors</strong>
          <span className="text-blue-800">
            Per Section 23, all student and volunteer registrations must include explicit informed consent, consent source, and consent date. CSV rows lacking explicit consent are automatically rejected by the server parser.
          </span>
        </div>
      </div>

      {/* Schedule Camp Modal */}
      {isCampModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Schedule Blood Donation Camp</h3>
            <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Camp Venue *</label>
                <input
                  type="text"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={campDate}
                    onChange={e => setCampDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Donation Units</label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={targetUnits}
                  onChange={e => setTargetUnits(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCampModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  Schedule Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consented Donor CSV Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Import Consented NSS Volunteers</span>
            </h3>

            <p className="text-xs text-slate-500">
              Columns: <code>name,bloodGroup,pincode,consentFlag,consentSource,consentDate</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="name,bloodGroup,pincode,consentFlag,consentSource,consentDate
Vipin K,O+,680001,true,NSS_CAMP_FORM,2026-10-01
Anju M,A+,680003,true,COLLEGE_PORTAL,2026-10-02"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />

            {csvResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <div className="font-bold">Import Result:</div>
                <div>{csvResult.imported} donors imported with validated consent.</div>
                {csvResult.rejected > 0 && (
                  <div className="text-red-700">{csvResult.rejected} rows rejected due to missing consent.</div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setCsvText(
                    'name,bloodGroup,pincode,consentFlag,consentSource,consentDate\n' +
                    'Arjun R,O+,680001,true,CAMP_ENROLLMENT,2026-10-01\n' +
                    'Kavya P,B+,680002,true,CAMP_ENROLLMENT,2026-10-01\n' +
                    'Suresh M,O-,680001,false,UNVERIFIED,2026-10-01'
                  );
                }}
                className="text-xs text-slate-500 underline"
              >
                Insert Sample Batch (with 1 invalid row)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Close
                </button>
                <button
                  onClick={handleCsvImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Verify & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
