import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Subjekt, EntityType } from '../../types/index';
import { MapPin, Phone, Globe, ShieldCheck, Clock } from 'lucide-react';

// Fix for default marker icon in leaflet with react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SubjektyMapProps {
  subjekty: Subjekt[];
}

export const SubjektyMap: React.FC<SubjektyMapProps> = ({ subjekty }) => {
  // Filter out subjekty that don't have valid coordinates
  const validSubjekty = useMemo(() => {
    return subjekty.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number');
  }, [subjekty]);

  const defaultCenter: [number, number] = [49.8175, 15.4730]; // Center of CZ
  const defaultZoom = 7;

  // Compute bounds if we have points
  const bounds = useMemo(() => {
    if (validSubjekty.length === 0) return null;
    const lats = validSubjekty.map(s => s.lat!);
    const lngs = validSubjekty.map(s => s.lng!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add small padding
    return L.latLngBounds([minLat - 0.05, minLng - 0.05], [maxLat + 0.05, maxLng + 0.05]);
  }, [validSubjekty]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={false}
        className="w-full h-full"
        bounds={bounds || undefined}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validSubjekty.map((subjekt) => (
          <Marker key={subjekt.id} position={[subjekt.lat!, subjekt.lng!]}>
            <Popup className="rounded-xl">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {formatEntityType(subjekt.type)}
                  </span>
                  {subjekt.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 mb-1 leading-tight">
                  {subjekt.titleBefore ? `${subjekt.titleBefore} ` : ''}
                  {subjekt.name}
                </h3>
                
                {subjekt.institution && (
                  <p className="text-sm text-slate-600 mb-2 leading-tight">
                    {subjekt.institution}
                  </p>
                )}
                
                <div className="space-y-1.5 mt-3">
                  {(subjekt.address || subjekt.city) && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <span>{subjekt.address ? `${subjekt.address}, ${subjekt.city}` : subjekt.city}</span>
                    </div>
                  )}
                  
                  {subjekt.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`tel:${subjekt.phone.replace(/\s+/g, '')}`} className="text-blue-600 hover:underline">
                        {subjekt.phone}
                      </a>
                    </div>
                  )}
                  
                  {subjekt.website && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={subjekt.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[180px]">
                        Webové stránky
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {bounds && <FitBounds bounds={bounds} />}
      </MapContainer>
      {validSubjekty.length === 0 && (
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              Pro aktuální filtry nejsou dostupné lokace na mapě.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to fit map to bounds dynamically
const FitBounds = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
};

function formatEntityType(type: EntityType | string): string {
  switch (type) {
    case 'SOUD': return 'Soud';
    case 'OSPOD': return 'OSPOD';
    case 'ZNALEC': return 'Soudní znalec';
    case 'ADVOKAT': return 'Advokát';
    case 'PORADNA_CHARITA': return 'Poradna / Charita';
    default: return String(type);
  }
}
