import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Subjekt, EntityType } from '../../types/index';
import { MapPin, Phone, Globe, ShieldCheck, Star, ArrowRight, ExternalLink } from 'lucide-react';

// Fix for default marker icon in leaflet with react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SubjektyMapProps {
  subjekty: Subjekt[];
  selectedSubjektId?: string | null;
  onSelectSubjekt?: (subjekt: Subjekt) => void;
  className?: string;
  height?: string;
}

const getEntityPinColor = (type: EntityType | string): string => {
  switch (type) {
    case 'SOUD':
      return '#4338ca'; // Indigo
    case 'OSPOD':
      return '#b91c1c'; // Red
    case 'ZNALEC':
      return '#7c3aed'; // Purple
    case 'ADVOKAT':
      return '#0284c7'; // Sky
    case 'PORADNA_CHARITA':
      return '#059669'; // Emerald
    default:
      return '#334155'; // Slate
  }
};

const createCustomPinIcon = (type: EntityType | string, isSelected: boolean) => {
  const color = getEntityPinColor(type);
  const size = isSelected ? 42 : 32;
  const strokeColor = isSelected ? '#fbbf24' : '#ffffff';

  return L.divIcon({
    className: 'custom-subjekt-marker-pin',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${isSelected ? `<span style="position: absolute; inset: -8px; border-radius: 9999px; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background-color: ${color};
          border: 3px solid ${strokeColor};
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease-in-out;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '20' : '15'}" height="${isSelected ? '20' : '15'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
};

// Component for programmatic map movement and centering
const MapController: React.FC<{
  selectedSubject?: Subjekt | null;
  bounds: L.LatLngBounds | null;
}> = ({ selectedSubject, bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedSubject && typeof selectedSubject.lat === 'number' && typeof selectedSubject.lng === 'number') {
      map.setView([selectedSubject.lat, selectedSubject.lng], 15, {
        animate: true,
        duration: 0.8,
      });
    } else if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [selectedSubject, bounds, map]);

  return null;
};

// Marker component with auto-popup on select
const SubjektMarker: React.FC<{
  subjekt: Subjekt;
  isSelected: boolean;
  onSelect?: (subjekt: Subjekt) => void;
}> = ({ subjekt, isSelected, onSelect }) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const customIcon = useMemo(
    () => createCustomPinIcon(subjekt.type, isSelected),
    [subjekt.type, isSelected]
  );

  return (
    <Marker
      ref={markerRef}
      position={[subjekt.lat!, subjekt.lng!]}
      icon={customIcon}
      eventHandlers={{
        click: () => {
          if (onSelect) onSelect(subjekt);
        },
      }}
    >
      <Popup className="custom-subjekt-popup">
        <div className="p-1 min-w-[240px] max-w-[300px] text-slate-900 font-sans space-y-2">
          {/* Header Badge & Rating */}
          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
            <span
              style={{
                backgroundColor: `${getEntityPinColor(subjekt.type)}15`,
                color: getEntityPinColor(subjekt.type),
                borderColor: `${getEntityPinColor(subjekt.type)}30`,
              }}
              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border"
            >
              {formatEntityType(subjekt.type)}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{subjekt.avgRating > 0 ? subjekt.avgRating.toFixed(1) : '–'}</span>
              <span className="text-[10px] text-slate-400 font-normal">({subjekt.reviewCount})</span>
            </div>
          </div>

          {/* Title & Organization */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
              {subjekt.titleBefore ? `${subjekt.titleBefore} ` : ''}
              {subjekt.name}
            </h3>
            {subjekt.position && (
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5 leading-tight">
                {subjekt.position}
              </p>
            )}
            {subjekt.institution && (
              <p className="text-[11px] text-slate-500 leading-tight">
                {subjekt.institution}
              </p>
            )}
          </div>

          {/* Contact details */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100 text-xs text-slate-600">
            {(subjekt.address || subjekt.city) && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span className="leading-tight">{subjekt.address || `${subjekt.city}, ${subjekt.region}`}</span>
              </div>
            )}

            {subjekt.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${subjekt.phone.replace(/\s+/g, '')}`} className="text-indigo-600 hover:underline">
                  {subjekt.phone}
                </a>
              </div>
            )}

            {subjekt.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={subjekt.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline truncate max-w-[200px] inline-flex items-center gap-1"
                >
                  <span className="truncate">{subjekt.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Action to view details */}
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(subjekt)}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Zobrazit detail & recenze</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export const SubjektyMap: React.FC<SubjektyMapProps> = ({
  subjekty,
  selectedSubjektId,
  onSelectSubjekt,
  className = '',
  height = 'h-full min-h-[480px]',
}) => {
  // Strictly filter out subjekty without valid numeric coordinates
  const validSubjekty = useMemo(() => {
    return subjekty.filter(
      (s) =>
        typeof s.lat === 'number' &&
        typeof s.lng === 'number' &&
        !isNaN(s.lat) &&
        !isNaN(s.lng)
    );
  }, [subjekty]);

  const selectedSubject = useMemo(() => {
    if (!selectedSubjektId) return null;
    return validSubjekty.find((s) => s.id === selectedSubjektId) || null;
  }, [selectedSubjektId, validSubjekty]);

  const defaultCenter: [number, number] = [49.8175, 15.473]; // Center of CZ
  const defaultZoom = 7;

  // Compute bounds of valid points
  const bounds = useMemo(() => {
    if (validSubjekty.length === 0) return null;
    const lats = validSubjekty.map((s) => s.lat!);
    const lngs = validSubjekty.map((s) => s.lng!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return L.latLngBounds([minLat - 0.05, minLng - 0.05], [maxLat + 0.05, maxLng + 0.05]);
  }, [validSubjekty]);

  return (
    <div
      className={`w-full ${height} rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0 ${className}`}
    >
      <MapContainer
        center={
          selectedSubject && typeof selectedSubject.lat === 'number'
            ? [selectedSubject.lat, selectedSubject.lng!]
            : defaultCenter
        }
        zoom={selectedSubject ? 15 : defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validSubjekty.map((subjekt) => (
          <SubjektMarker
            key={subjekt.id}
            subjekt={subjekt}
            isSelected={subjekt.id === selectedSubjektId}
            onSelect={onSelectSubjekt}
          />
        ))}

        <MapController selectedSubject={selectedSubject} bounds={bounds} />
      </MapContainer>

      {validSubjekty.length === 0 && (
        <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-xs z-[1000] flex items-center justify-center p-6 text-center">
          <div className="max-w-sm space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Žádné subjekty se souřadnicemi</h4>
            <p className="text-slate-500 text-xs">
              Pro aktuálně zvolený filtr nejsou k dispozici subjekty s ověřenou polohou na mapě.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export function formatEntityType(type: EntityType | string): string {
  switch (type) {
    case 'SOUD':
      return 'Soud';
    case 'OSPOD':
      return 'OSPOD';
    case 'ZNALEC':
      return 'Soudní znalec';
    case 'ADVOKAT':
      return 'Advokát';
    case 'PORADNA_CHARITA':
      return 'Poradna / Charita';
    default:
      return String(type);
  }
}
