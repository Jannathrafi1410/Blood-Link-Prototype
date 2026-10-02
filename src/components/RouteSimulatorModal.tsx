import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, Navigation, Clock, ShieldCheck, MapPin, Building2, CheckCircle2 } from 'lucide-react';

interface RouteSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string; // e.g. D-014
  originName?: string;
  originCoords?: [number, number];
  destinationName?: string;
  destinationCoords?: [number, number];
  distanceKm?: number;
}

export const RouteSimulatorModal: React.FC<RouteSimulatorModalProps> = ({
  isOpen,
  onClose,
  candidateId = 'D-014',
  originName = 'Candidate D-014 Coarse Centroid (Thrissur East)',
  originCoords = [10.518, 76.228],
  destinationName = 'ABC Hospital, Thrissur (Trauma Transfusion Center)',
  destinationCoords = [10.5276, 76.2144],
  distanceKm = 2.1
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [transitStep, setTransitStep] = useState<number>(2); // 1: Accepted, 2: En Route, 3: Arrived

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    try {
      const midLat = (originCoords[0] + destinationCoords[0]) / 2;
      const midLng = (originCoords[1] + destinationCoords[1]) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 14,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Origin Marker (Coarse Donor Zone)
      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `
          <div style="background-color: #3B82F6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
            D
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Destination Marker (Hospital)
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div style="background-color: #DC2626; color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
            🏥
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker(originCoords, { icon: originIcon })
        .bindPopup(`<strong>Donor Centroid (~1km jitter)</strong><br/>Candidate ${candidateId}`)
        .addTo(map);

      L.marker(destinationCoords, { icon: destIcon })
        .bindPopup(`<strong>${destinationName}</strong><br/>Emergency Room 104`)
        .addTo(map);

      // Route Polyline (Simulated OSRM curved street path between Swaraj Round & East Fort)
      const routePoints: [number, number][] = [
        originCoords,
        [10.521, 76.223],
        [10.524, 76.218],
        destinationCoords
      ];

      const polyline = L.polyline(routePoints, {
        color: '#DC2626',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Map initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, originCoords, destinationCoords, candidateId, destinationName]);

  if (!isOpen) return null;

  const estimatedMinutes = Math.max(4, Math.round(distanceKm * 2.8));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[620px]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl">
              <Navigation className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold">Transfusion Transit & Route Simulator</h2>
              <p className="text-xs text-slate-400">
                Live Geodesic Tracking (OSRM / Haversine) · Candidate {candidateId} to ABC Hospital
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ETA & Transit Stats Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Approx Distance:</span>
              <div className="font-bold text-slate-900 text-sm">{distanceKm.toFixed(1)} km</div>
            </div>
            <div>
              <span className="text-slate-500">Estimated Transit:</span>
              <div className="font-bold text-red-600 text-sm">~{estimatedMinutes} Minutes</div>
            </div>
            <div>
              <span className="text-slate-500">Traffic Factor:</span>
              <div className="font-bold text-emerald-700 text-sm">Light (Thrissur City Corridor)</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Navigation (Coarse Anchor)</span>
          </div>
        </div>

        {/* Interactive Leaflet Route Map */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          <div className="absolute top-3 right-3 z-10 bg-white/95 px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm space-y-0.5">
            <div className="font-bold text-slate-900">Destination:</div>
            <div className="text-slate-600">ABC Hospital, Room 104</div>
          </div>
        </div>

        {/* Status Stepper Tracker */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {[
              { id: 1, label: 'SOS Accepted' },
              { id: 2, label: 'En Route to Bank' },
              { id: 3, label: 'Arrived at Reception' }
            ].map(step => (
              <button
                key={step.id}
                onClick={() => setTransitStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  transitStep >= step.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {transitStep >= step.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
