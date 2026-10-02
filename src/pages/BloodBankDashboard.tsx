import React, { useState, useEffect } from 'react';
import { InventoryItem, BloodGroup, BloodComponent, InventoryStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { BloodStorageVisualizer } from '../components/BloodStorageVisualizer';
import {
  Droplet,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Building2
} from 'lucide-react';

export const BloodBankDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState<any[]>([]);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  // New item form state
  const [newGroup, setNewGroup] = useState<BloodGroup>('O+');
  const [newComponent, setNewComponent] = useState<BloodComponent>('Whole Blood');
  const [newUnits, setNewUnits] = useState(5);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await api.getInventory('bb-jubilee');
      setInventory(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addInventoryItem({
        bloodBankId: 'bb-jubilee',
        bloodGroup: newGroup,
        component: newComponent,
        units: newUnits
      });
      setIsAddModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory record?')) return;
    try {
      await api.deleteInventoryItem(id);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleCsvImport = async () => {
    setCsvErrors([]);
    setCsvSuccess(null);
    try {
      const res = await api.importInventoryCsv(csvText, 'bb-jubilee');
      if (res.errors && res.errors.length > 0) {
        setCsvErrors(res.errors);
      }
      setCsvSuccess(`Successfully committed ${res.unitsImported} units from CSV.`);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'CSV Import failed');
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/blood-banks/inventory/csv-template';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Blood Bank Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Jubilee Mission Blood Centre</h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Verified Blood Bank ✓
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              NABH Accredited Central Blood Bank · License BB-LIC-KL-4402 · PIN 680005 (Thrissur)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Freshness Classification Rule Card (Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>FRESH (&lt; 1 hr)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Prime emergency match availability</div>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>RECENT (1–6 hrs)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Verified stock ready for dispatch</div>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>AGING (6–24 hrs)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires re-verification before match</div>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>STALE (&gt; 24 hrs)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Excluded from algorithmic matching</div>
        </div>
      </div>

      {/* Cold Storage Bay Visualizer */}
      <BloodStorageVisualizer inventory={inventory} />

      {/* Main Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Component Inventory Register
            </h2>
            <p className="text-xs text-slate-500">
              Live stock counts synced with regional emergency matching engine
            </p>
          </div>
          <button
            onClick={loadInventory}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Blood Group</th>
                <th className="py-3 px-6">Component</th>
                <th className="py-3 px-6">Available Units</th>
                <th className="py-3 px-6">Freshness</th>
                <th className="py-3 px-6">Expiry Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No inventory records present. Click &quot;Add Stock Item&quot; or upload CSV.
                  </td>
                </tr>
              ) : (
                inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6">
                      <span className="text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                        {item.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      {item.component}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900 text-sm">
                      {item.units} Units
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.freshness} type="freshness" />
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {new Date(item.expiryDate).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Blood Inventory Unit</h3>
            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={newGroup}
                  onChange={e => setNewGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-600"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Component</label>
                <select
                  value={newComponent}
                  onChange={e => setNewComponent(e.target.value as BloodComponent)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Red Cells">Packed Red Cells</option>
                  <option value="Platelets">Platelets</option>
                  <option value="Plasma">Fresh Frozen Plasma</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newUnits}
                  onChange={e => setNewUnits(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Add to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Batch CSV Inventory Import</span>
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste standard 5-column CSV rows: <code>bloodGroup,component,units,collectionDate,expiryDate</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="bloodGroup,component,units,collectionDate,expiryDate
O+,Whole Blood,5,2026-10-01,2026-11-05
A+,Red Cells,10,2026-09-28,2026-11-08"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />

            {csvSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{csvSuccess}</span>
              </div>
            )}

            {csvErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 max-h-24 overflow-y-auto">
                <div className="font-bold">Validation Errors:</div>
                {csvErrors.map((err, i) => (
                  <div key={i}>Row {err.row}: {err.error}</div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setCsvText(
                    'bloodGroup,component,units,collectionDate,expiryDate\n' +
                    'O+,Whole Blood,6,2026-10-01,2026-11-05\n' +
                    'B+,Platelets,4,2026-10-02,2026-10-07\n' +
                    'AB+,Plasma,12,2026-09-15,2027-09-15'
                  );
                }}
                className="text-xs text-slate-500 underline hover:text-slate-800"
              >
                Insert Sample Batch
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Validate & Commit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
