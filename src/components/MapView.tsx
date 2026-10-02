import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hospital, BloodBank } from '../types';
import { MapPin, Navigation, Layers, ShieldAlert, Building2, Droplet, List, Map as MapIcon } from 'lucide-react';

interface MapViewProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  hospitals: Array<Hospital & { distanceKm?: number }>;
  bloodBanks: Array<BloodBank & { distanceKm?: number; inventorySummary?: string }>;
  donorZones: Array<{ pincode: string; district: string; state: string; lat: number; lng: number; donorCount: number; availableCount: number }>;
  selectedRadiusKm?: number;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectBloodBank?: (bank: BloodBank) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 12,
  hospitals,
  bloodBanks,
  donorZones,
  selectedRadiusKm = 5,
  onSelectHospital,
  onSelectBloodBank,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    radiusCircles: L.LayerGroup;
    hospitals: L.LayerGroup;
    banks: L.LayerGroup;
    donorZones: L.LayerGroup;
  }>({
    radiusCircles: L.layerGroup(),
    hospitals: L.layerGroup(),
    banks: L.layerGroup(),
    donorZones: L.layerGroup()
  });

  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [mapError, setMapError] = useState<string | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [showDonors, setShowDonors] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || activeTab !== 'map') return;

    try {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      layersRef.current.radiusCircles.addTo(map);
      layersRef.current.donorZones.addTo(map);
      layersRef.current.hospitals.addTo(map);
      layersRef.current.banks.addTo(map);

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.warn('Leaflet initialization fallback:', err);
      setMapError('Unable to load interactive map canvas. Switching to verified list mode.');
      setActiveTab('list');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Render markers and layers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Radius Circles (5 km, 10 km, or custom)
    layersRef.current.radiusCircles.clearLayers();
    if (showRadius) {
      // 5km inner circle (Wave 1)
      L.circle(center, {
        radius: (selectedRadiusKm || 5) * 1000,
        color: '#DC2626',
        fillColor: '#EF4444',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(layersRef.current.radiusCircles);

      // 10km escalation wave circle
      L.circle(center, {
        radius: 10000,
        color: '#F59E0B',
        fillColor: '#FBBF24',
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '6, 6'
      }).addTo(layersRef.current.radiusCircles);
    }

    // 2. Hospital Markers (Hospital SVG Icon)
    layersRef.current.hospitals.clearLayers();
    const hospitalIcon = L.divIcon({
      className: 'custom-hosp-marker',
      html: `
        <div style="background-color: #DC2626; color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); border: 2px solid white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -20]
    });

    hospitals.forEach(h => {
      const marker = L.marker([h.location.lat, h.location.lng], { icon: hospitalIcon });
      const dist = h.distanceKm ? `${h.distanceKm.toFixed(1)} km` : 'Near';
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 2px;">🏥 ${h.name}</div>
          <div style="font-size: 11px; color: #16A34A; font-weight: 600; margin-bottom: 6px;">Verified ✓ · ${h.traumaLevel || 'Trauma Center'}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Distance:</strong> ${dist}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;"><strong>Emergency:</strong> 24/7 Available</div>
          <div style="font-size: 11px; color: #94A3B8;">Pincode: ${h.pincode} (${h.district})</div>
        </div>
      `);
      marker.addTo(layersRef.current.hospitals);
    });

    // 3. Blood Bank Markers (Teal/Emerald Blood Drop Icon)
    layersRef.current.banks.clearLayers();
    const bankIcon = L.divIcon({
      className: 'custom-bank-marker',
      html: `
        <div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); border: 2px solid white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8 6 4 10 4 15a8 8 0 0 0 16 0c0-5-4-9-8-13Z"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -20]
    });

    bloodBanks.forEach(b => {
      const marker = L.marker([b.location.lat, b.location.lng], { icon: bankIcon });
      const dist = b.distanceKm ? `${b.distanceKm.toFixed(1)} km` : 'Near';
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 2px;">🩸 ${b.name}</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 6px;">Licensed Transfusion Centre ✓</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Distance:</strong> ${dist}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;"><strong>Stock:</strong> ${b.inventorySummary || 'Available'}</div>
          <div style="font-size: 11px; color: #94A3B8;">Pincode: ${b.pincode} · ${b.operatingHours}</div>
        </div>
      `);
      marker.addTo(layersRef.current.banks);
    });

    // 4. Aggregate Donor Zones (Privacy-Safe Coarse Circles: Section 9 & 10)
    layersRef.current.donorZones.clearLayers();
    if (showDonors) {
      donorZones.forEach(z => {
        const circle = L.circle([z.lat, z.lng], {
          radius: 1200, // Coarse ~1.2 km privacy radius
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.18,
          weight: 1.5
        });

        circle.bindPopup(`
          <div style="font-family: inherit; padding: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #1E3A8A; margin-bottom: 2px;">🛡️ Donor Zone (~2 km resolution)</div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Area: Pincode ${z.pincode} (${z.district})</div>
            <div style="font-size: 12px; color: #0F172A; margin-bottom: 2px;"><strong>Active Donors:</strong> ${z.donorCount}</div>
            <div style="font-size: 12px; color: #16A34A; margin-bottom: 6px;"><strong>Ready & Eligible:</strong> ${z.availableCount}</div>
            <div style="font-size: 10px; color: #64748B; font-style: italic;">Exact home coordinates are never stored or displayed to protect privacy.</div>
          </div>
        `);
        circle.addTo(layersRef.current.donorZones);
      });
    }
  }, [hospitals, bloodBanks, donorZones, center, selectedRadiusKm, showRadius, showDonors]);

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'map' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'list' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Fallback List Mode</span>
            </button>
          </div>

          {mapError && (
            <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[11px]">
              {mapError}
            </span>
          )}
        </div>

        {/* Legend & Layer Toggles */}
        {activeTab === 'map' && (
          <div className="flex items-center gap-3 text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showRadius}
                onChange={e => setShowRadius(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>{selectedRadiusKm} km Radius</span>
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showDonors}
                onChange={e => setShowDonors(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span>Donor Zones (~2km)</span>
              </span>
            </label>

            <span className="hidden sm:inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
              <span>Blood Banks</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Display Area */}
      {activeTab === 'map' ? (
        <div className="relative w-full h-[480px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          {/* Subtle Map Watermark / Safe Indicator */}
          <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] text-slate-600 border border-slate-200 shadow-xs pointer-events-none">
            OpenStreetMap PostGIS · Zero Donor GPS Exposed
          </div>
        </div>
      ) : (
        /* Fallback List View (Section 10 requirement) */
        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          <div className="text-xs text-slate-500">
            Showing verified healthcare facilities and aggregate donor zones for current location centroid.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hospitals Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                <span>Verified Hospitals ({hospitals.length})</span>
              </h4>
              <div className="space-y-2">
                {hospitals.map(h => (
                  <div key={h.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{h.name}</div>
                        <div className="text-xs text-emerald-700 font-medium">Verified Facility ✓ · {h.traumaLevel}</div>
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {h.distanceKm?.toFixed(1) || '0.0'} km
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>PIN: {h.pincode} · {h.district}</span>
                      <span className="text-slate-700 font-medium">{h.phone || '24/7 Emergency'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Banks Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-emerald-600" />
                <span>Nearby Blood Banks ({bloodBanks.length})</span>
              </h4>
              <div className="space-y-2">
                {bloodBanks.map(b => (
                  <div key={b.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-600">License: {b.licenseNumber}</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {b.distanceKm?.toFixed(1) || '0.0'} km
                      </span>
                    </div>
                    <div className="mt-2 p-1.5 bg-slate-50 rounded text-xs text-slate-700">
                      <strong>Current Inventory:</strong> {b.inventorySummary || 'Contact center'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
