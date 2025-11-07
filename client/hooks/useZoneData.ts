import { useState, useCallback, useEffect } from "react";
import { classifyZone } from "@/api/tomtom";

export interface Zone {
  id: number;
  name: string;
  category: "Commercial" | "Residential" | "Mixed-Use";
  lat: number;
  lng: number;
  poiCount: number;
  trafficFlow: number;
  confidence: number;
  poiBreakdown: {
    commercial: number;
    residential: number;
    services: number;
  };
  mobilityPattern: string;
}

interface UseZoneDataProps {
  initialZones?: Zone[];
}

/**
 * Custom hook for managing zone data and classification
 */
export const useZoneData = ({ initialZones = [] }: UseZoneDataProps = {}) => {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update a zone's data (simulating real-time updates)
   */
  const updateZone = useCallback((zoneId: number, updates: Partial<Zone>) => {
    setZones((prevZones) =>
      prevZones.map((zone) =>
        zone.id === zoneId ? { ...zone, ...updates } : zone,
      ),
    );
  }, []);

  /**
   * Simulate real-time traffic updates
   */
  const startTrafficSimulation = useCallback(() => {
    const interval = setInterval(() => {
      setZones((prevZones) =>
        prevZones.map((zone) => ({
          ...zone,
          trafficFlow: Math.max(
            10,
            Math.min(95, zone.trafficFlow + (Math.random() - 0.5) * 10),
          ),
        })),
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Add a new zone
   */
  const addZone = useCallback((zone: Zone) => {
    setZones((prevZones) => [...prevZones, zone]);
  }, []);

  /**
   * Remove a zone
   */
  const removeZone = useCallback((zoneId: number) => {
    setZones((prevZones) => prevZones.filter((zone) => zone.id !== zoneId));
  }, []);

  /**
   * Classify a zone based on its characteristics
   */
  const classifyZoneData = useCallback(
    (zoneData: Omit<Zone, "id" | "category" | "confidence">) => {
      const classification = classifyZone(
        zoneData.poiCount,
        zoneData.trafficFlow,
        zoneData.poiBreakdown,
      );

      return {
        ...zoneData,
        category: classification.category,
        confidence: classification.confidence,
      };
    },
    [],
  );

  return {
    zones,
    loading,
    error,
    updateZone,
    addZone,
    removeZone,
    classifyZoneData,
    startTrafficSimulation,
  };
};

/**
 * Hook for managing selected zone state
 */
export const useSelectedZone = (initialZone?: Zone) => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(
    initialZone || null,
  );

  return {
    selectedZone,
    setSelectedZone,
  };
};

/**
 * Hook for managing analytics and insights
 */
export const useZoneAnalytics = (zone: Zone | null) => {
  const [analytics, setAnalytics] = useState<{
    dominantPOIType: string;
    totalPOIs: number;
    mobilityPattern: string;
    confidenceScore: number;
  } | null>(null);

  useEffect(() => {
    if (!zone) {
      setAnalytics(null);
      return;
    }

    // Calculate dominant POI type
    const breakdown = zone.poiBreakdown;
    const dominantPOIType = Object.keys(breakdown).reduce((prev, current) =>
      breakdown[current as keyof typeof breakdown] >
      breakdown[prev as keyof typeof breakdown]
        ? current
        : prev,
    );

    setAnalytics({
      dominantPOIType:
        dominantPOIType.charAt(0).toUpperCase() + dominantPOIType.slice(1),
      totalPOIs: zone.poiCount,
      mobilityPattern: zone.mobilityPattern,
      confidenceScore: zone.confidence,
    });
  }, [zone]);

  return analytics;
};
