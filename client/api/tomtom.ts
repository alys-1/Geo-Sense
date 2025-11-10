import axios from "axios";

const TOMTOM_API_KEY = import.meta.env.REACT_APP_TOMTOM_API_KEY || "demo";
const TOMTOM_BASE_URL = "https://api.tomtom.com";

export interface POI {
  id: string;
  name: string;
  type: string;
  position: {
    lat: number;
    lon: number;
  };
  address?: string;
}

export interface TrafficFlowSegment {
  id: string;
  speedKmH: number;
  freeFlowSpeedKmH: number;
  currentSpeed: number;
  position: {
    lat: number;
    lon: number;
  };
}

export interface Route {
  distance: number;
  duration: number;
  summary: {
    lengthInMeters: number;
    travelTimeInSeconds: number;
  };
  legs: Array<{
    points: Array<{ latitude: number; longitude: number }>;
  }>;
}

export interface ZoneClassification {
  zoneId: string;
  category: "Commercial" | "Residential" | "Mixed-Use";
  poiDensity: number;
  trafficRatio: number;
  confidence: number;
}

export interface SearchResult {
  id: string;
  position: {
    lat: number;
    lon: number;
  };
  address: string;
  poi?: {
    name: string;
  };
  type: string;
}

/**
 * Search for areas by query
 */
export const searchAreas = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await axios.get(`/api/tomtom/search-areas`, {
      params: { query },
    });

    return response.data || [];
  } catch (error) {
    console.error("Error searching areas:", error);
    return [];
  }
};

/**
 * Search for Points of Interest within a bounding box or nearby a location
 */
export const searchPOIs = async (
  lat: number,
  lon: number,
  radius: number = 5000,
  query: string = "",
): Promise<POI[]> => {
  try {
    const response = await axios.get(`/api/tomtom/search-pois`, {
      params: {
        lat,
        lon,
        radius,
        ...(query && { query }),
      },
    });

    return response.data || [];
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return [];
  }
};

/**
 * Get traffic flow data for a specific location
 */
export const getTrafficFlow = async (
  lat: number,
  lon: number,
): Promise<TrafficFlowSegment[]> => {
  try {
    const response = await axios.get(`/api/tomtom/traffic-flow`, {
      params: { lat, lon },
    });

    return response.data || [];
  } catch (error) {
    console.error("Error fetching traffic flow:", error);
    return [];
  }
};

/**
 * Calculate routing with traffic
 */
export const calculateRoute = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  routeType: "fastest" | "eco" | "safe" = "fastest",
): Promise<Route> => {
  try {
    const response = await axios.get(`/api/tomtom/calculate-route`, {
      params: {
        startLat,
        startLon,
        endLat,
        endLon,
        routeType,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error calculating route:", error);
    throw error;
  }
};

/**
 * Get routing with geo waypoints (for walk routes, safe routes)
 */
export const getRouteWithWaypoints = async (
  waypoints: Array<{ lat: number; lon: number }>,
  routeType: "fastest" | "pedestrian" = "fastest",
): Promise<Route> => {
  try {
    const waypointString = waypoints.map((w) => `${w.lat},${w.lon}`).join(":");

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${waypointString}/json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          routeType,
          traffic: true,
        },
      },
    );

    const route = response.data.routes[0];
    return {
      distance: route.summary.lengthInMeters,
      duration: route.summary.travelTimeInSeconds,
      summary: {
        lengthInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds,
      },
      legs: route.legs,
    };
  } catch (error) {
    console.error("Error calculating route with waypoints:", error);
    throw error;
  }
};

/**
 * Classify zones based on POI density and traffic ratio
 */
export const classifyZone = (
  poiCount: number,
  trafficIntensity: number,
  poiBreakdown: {
    commercial: number;
    residential: number;
    services: number;
  },
): ZoneClassification => {
  const commercialRatio = poiBreakdown.commercial / poiCount;
  const residentialRatio = poiBreakdown.residential / poiCount;

  let category: "Commercial" | "Residential" | "Mixed-Use";

  if (commercialRatio > 0.5) {
    category = "Commercial";
  } else if (residentialRatio > 0.5) {
    category = "Residential";
  } else {
    category = "Mixed-Use";
  }

  let confidence = 0.5;
  if (category === "Commercial" && trafficIntensity > 60) {
    confidence = Math.min(0.95, 0.5 + (trafficIntensity - 50) * 0.01);
  } else if (category === "Residential" && trafficIntensity < 50) {
    confidence = Math.min(0.95, 0.5 + (50 - trafficIntensity) * 0.01);
  } else {
    confidence = 0.75;
  }

  return {
    zoneId: `zone_${Date.now()}`,
    category,
    poiDensity: poiCount,
    trafficRatio: trafficIntensity,
    confidence,
  };
};

/**
 * Get traffic congestion level (0-100)
 */
export const getTrafficCongestionLevel = async (
  lat: number,
  lon: number,
): Promise<number> => {
  try {
    const flowData = await getTrafficFlow(lat, lon);

    // Return default value if no traffic data available
    if (!flowData || flowData.length === 0) {
      // Generate a pseudo-random but deterministic value based on coordinates
      const seed = Math.round((Math.abs(lat) + Math.abs(lon)) * 100) % 100;
      return 30 + seed % 40; // Returns between 30-70
    }

    // Filter out invalid speed data
    const validSegments = flowData.filter(
      (seg) => seg.currentSpeed > 0 && seg.freeFlowSpeedKmH > 0
    );

    if (validSegments.length === 0) {
      return 45; // Moderate default
    }

    const avgSpeed =
      validSegments.reduce((sum, seg) => sum + seg.currentSpeed, 0) /
      validSegments.length;
    const avgFreeFlow =
      validSegments.reduce((sum, seg) => sum + seg.freeFlowSpeedKmH, 0) /
      validSegments.length;

    // Calculate congestion as percentage of free flow speed
    const congestion = Math.max(
      0,
      Math.min(100, ((avgFreeFlow - avgSpeed) / avgFreeFlow) * 100),
    );
    return Math.round(congestion);
  } catch {
    // Return a default moderate traffic level on error
    return 45;
  }
};

/**
 * Analyze POI categories for a zone
 */
export const analyzePOICategories = (pois: POI[]): Record<string, number> => {
  const categories: Record<string, number> = {};

  pois.forEach((poi) => {
    const category = poi.type.toLowerCase();
    categories[category] = (categories[category] || 0) + 1;
  });

  return categories;
};
