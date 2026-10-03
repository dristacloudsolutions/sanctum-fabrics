'use client';

import { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Search, X } from 'lucide-react';
import type { AddressDetails } from '@/lib/dristaService';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const LIBRARIES: 'places'[] = ['places'];
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India, roughly centered

// Pulls the individual address components a checkout form needs out of a
// Google Geocoder result — Google's address_components is a flat array of
// {long_name, types[]} entries, not a keyed object.
function parseAddressComponents(components: google.maps.GeocoderAddressComponent[]) {
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name || '';
  const streetNumber = get('street_number');
  const route = get('route');
  const sublocality = get('sublocality') || get('sublocality_level_1');
  const line1 = [streetNumber, route].filter(Boolean).join(' ') || sublocality || '';
  return {
    line1,
    line2: sublocality && line1 !== sublocality ? sublocality : undefined,
    city: get('locality') || get('administrative_area_level_2') || '',
    state: get('administrative_area_level_1') || '',
    pincode: get('postal_code') || '',
    country: get('country') || 'India',
  };
}

export default function AddressMapPicker({
  onConfirm,
  onClose,
}: {
  onConfirm: (address: AddressDetails) => void;
  onClose: () => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [resolved, setResolved] = useState<AddressDetails | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    setGeocoding(true);
    setError(null);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      if (status !== 'OK' || !results?.[0]) {
        setError('Could not resolve an address for this location — try a nearby spot.');
        return;
      }
      const parsed = parseAddressComponents(results[0].address_components);
      setResolved({ ...parsed, lat, lng });
    });
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const loc = place?.geometry?.location;
    if (!loc) return;
    const lat = loc.lat();
    const lng = loc.lng();
    setMarker({ lat, lng });
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(16);
    if (place?.address_components) {
      setResolved({ ...parseAddressComponents(place.address_components), lat, lng });
    } else {
      reverseGeocode(lat, lng);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <h3 className="font-serif text-lg text-[color:var(--ink)]">Pick your location on the map</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[color:var(--ink)]/50 hover:text-[color:var(--ink)]">
            <X size={20} />
          </button>
        </div>

        {!GOOGLE_MAPS_API_KEY ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[color:var(--ink)]/50">
            Map picker isn&apos;t configured for this store yet — enter your address manually below.
          </div>
        ) : loadError ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-red-500">
            Failed to load Google Maps. Please enter your address manually.
          </div>
        ) : !isLoaded ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--ink)]/50">Loading map…</div>
        ) : (
          <>
            <div className="border-b border-[color:var(--border)] p-3">
              <Autocomplete
                onLoad={(ac) => { autocompleteRef.current = ac; }}
                onPlaceChanged={handlePlaceChanged}
                options={{ componentRestrictions: { country: 'in' } }}
              >
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
                  <input
                    type="text"
                    placeholder="Search for an area, street or landmark…"
                    className="w-full rounded-full border border-[color:var(--border)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[color:var(--accent)]"
                  />
                </div>
              </Autocomplete>
            </div>

            <div className="relative flex-1">
              <GoogleMap
                onLoad={(map) => { mapRef.current = map; }}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={marker || DEFAULT_CENTER}
                zoom={marker ? 16 : 5}
                onClick={handleMapClick}
              >
                {marker && <Marker position={marker} draggable onDragEnd={handleMapClick} />}
              </GoogleMap>
              {!marker && (
                <p className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white">
                  Search above or tap the map to drop a pin
                </p>
              )}
            </div>

            <div className="border-t border-[color:var(--border)] p-4">
              {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
              {geocoding && <p className="mb-2 text-sm text-[color:var(--ink)]/50">Resolving address…</p>}
              {resolved && !geocoding && (
                <p className="mb-3 text-sm text-[color:var(--ink)]/70">
                  {[resolved.line1, resolved.line2, resolved.city, resolved.state, resolved.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              <button
                type="button"
                disabled={!resolved || geocoding}
                onClick={() => resolved && onConfirm(resolved)}
                className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use This Location
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
