import axios from "axios";

// TomTom API configuration
// In production, these should be environment variables
const TOMTOM_API_KEY = process.env.REACT_APP_TOMTOM_API_KEY || "demo";
const TOMTOM_BASE_URL = "https://api.tomtom.com";

interface POI {
  id: string;
  name: string;
  type: string;
  position: {
    lat: number;
    lon: number;
  };
}

interface TrafficFlowSegment {
  id: string;
  speedKmH: number;
  freeFlowSpeedKmH: number;
  currentSpeed: number;
  position: {
    lat: number;
    lon: number;
  };
}

interface ZoneClassification {
  zoneId: string;
  category: "Commercial" | "Residential" | "Mixed-Use";
  poiDensity: number;
  trafficRatio: number;
  confidence: number;
}

/**
 * Search for Points of Interest within a bounding box
 */
export const searchPOIs = async (
  lat: number,
  lon: number,
  radius: number = 5000,
  query: string = ""
): Promise<POI[]> => {
  try {
    const response = await axios.get(`${TOMTOM_BASE_URL}/search/2/nearby.json`, {
      params: {
        key: TOMTOM_API_KEY,
        lat,
        lon,
        radius,
        ...(query && { query }),
      },
    });

    return response.data.results.map((result: any) => ({
      id: result.id,
      name: result.poi?.name || result.address?.streetName,
      type: result.poi?.classifications?.[0]?.name || "Unknown",
      position: {
        lat: result.position.lat,
        lon: result.position.lon,
      },
    }));
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
  lon: number
): Promise<TrafficFlowSegment[]> => {
  try {
    const response = await axios.get(`${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/absolute/10/json`, {
      params: {
        key: TOMTOM_API_KEY,
        point: `${lat},${lon}`,
      },
    });

    return response.data.flowSegmentData.map((segment: any) => ({
      id: segment.segmentId,
      speedKmH: segment.currentSpeed,
      freeFlowSpeedKmH: segment.freeFlowSpeed,
      currentSpeed: segment.currentSpeed,
      position: {
        lat: segment.coordinates[0][1],
        lon: segment.coordinates[0][0],
      },
    }));
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
  routeType: "fastest" | "eco" | "safe" = "fastest"
): Promise<{
  distance: number;
  duration: number;
  polyline: string;
}> => {
  try {
    const response = await axios.get(
      `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          routeType,
          traffic: true,
        },
      }
    );

    const route = response.data.routes[0];
    return {
      distance: route.summary.lengthInMeters,
      duration: route.summary.travelTimeInSeconds,
      polyline: route.legs[0].points,
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    throw error;
  }
};

/**
 * Classify zones based on POI density and traffic ratio
 * This is a client-side classification combining TomTom data
 */
export const classifyZone = (
  poiCount: number,
  trafficIntensity: number,
  poiBreakdown: {
    commercial: number;
    residential: number;
    services: number;
  }
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

  // Confidence is higher when traffic and POI patterns align with category
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
