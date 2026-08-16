export interface GeoLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  road?: string;
  city?: string;
  postcode?: string;
}

export interface RouteCalculationResult {
  distanceKm: number;
  durationMinutes: number;
  isEstimated: boolean;
  provider: string;
}

export interface IGeocodingProvider {
  geocode(address: string): Promise<GeoLocation | null>;
}

export interface IRoutingProvider {
  calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteCalculationResult>;
}

/**
 * OpenStreetMap Nominatim Geocoding Provider
 */
export class NominatimGeocodingProvider implements IGeocodingProvider {
  private userAgent = 'TataMaPravo-SynthesisCare/1.0';

  async geocode(address: string): Promise<GeoLocation | null> {
    if (!address || address.trim().length < 3) return null;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1&addressdetails=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'cs,en',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality,
          road: item.address?.road,
          postcode: item.address?.postcode,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * OpenStreetMap OSRM Routing Provider with offline Haversine fallback
 */
export class OsrmRoutingProvider implements IRoutingProvider {
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteCalculationResult> {
    // Basic validation
    if (
      !origin ||
      !destination ||
      origin.lat === 0 ||
      destination.lat === 0 ||
      isNaN(origin.lat) ||
      isNaN(destination.lat)
    ) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        isEstimated: true,
        provider: 'None',
      };
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          return {
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMinutes: Math.max(1, Math.round(route.duration / 60)),
            isEstimated: false,
            provider: 'OSRM',
          };
        }
      }
    } catch {
      // Fallback below
    }

    // Deterministic Offline Haversine Calculation with 1.32 road tortuosity factor
    const haversineKm = GeoRoutingService.haversineDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const roadDistanceKm = Math.round(haversineKm * 1.32 * 10) / 10;
    // Average 48 km/h in mixed municipal/regional traffic
    const travelMinutes = Math.max(1, Math.round((roadDistanceKm / 48) * 60));

    return {
      distanceKm: roadDistanceKm,
      durationMinutes: travelMinutes,
      isEstimated: true,
      provider: 'HaversineRoadApproximation',
    };
  }
}

export class GeoRoutingService {
  private static geocodingProvider: IGeocodingProvider = new NominatimGeocodingProvider();
  private static routingProvider: IRoutingProvider = new OsrmRoutingProvider();

  public static setProviders(geocoder: IGeocodingProvider, router: IRoutingProvider) {
    this.geocodingProvider = geocoder;
    this.routingProvider = router;
  }

  /**
   * Geocode an address string
   */
  public static async geocodeAddress(address: string): Promise<GeoLocation | null> {
    return this.geocodingProvider.geocode(address);
  }

  /**
   * Calculate route distance and duration between two coordinates
   */
  public static async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteCalculationResult> {
    return this.routingProvider.calculateRoute(origin, destination);
  }

  /**
   * Great-circle distance between two coordinates in km
   */
  public static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
