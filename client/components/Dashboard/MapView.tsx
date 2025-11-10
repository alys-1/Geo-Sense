import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { POI } from "@/api/tomtom";

interface Zone {
  id: number;
  name: string;
  category: "Commercial" | "Residential" | "Mixed-Use";
  lat: number;
  lng: number;
  poiCount: number;
  trafficFlow: number;
  confidence: number;
  pois: POI[];
  poiBreakdown: {
    commercial: number;
    residential: number;
    services: number;
  };
  mobilityPattern: string;
  trafficRatio: number;
  dominantCategory: string;
}

interface MapViewProps {
  selectedZone: Zone;
  zones: Zone[];
  setSelectedZone: (zone: Zone) => void;
  showHeatmap: boolean;
  showPOIs: boolean;
  getCategoryColor: (category: string) => string;
}

const defaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const poiIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [36, 36],
});

// Create custom traffic heatmap colors
const getTrafficColor = (intensity: number): string => {
  if (intensity > 80) return "#EF4444"; // Red - Severe
  if (intensity > 60) return "#F97316"; // Orange - Heavy
  if (intensity > 40) return "#EAB308"; // Yellow - Moderate
  if (intensity > 20) return "#84CC16"; // Lime - Light
  return "#22C55E"; // Green - Clear
};

// Get traffic circle opacity based on intensity
const getTrafficOpacity = (intensity: number): number => {
  return Math.min(0.3 + (intensity / 100) * 0.4, 0.7);
};

const MapView = ({
  selectedZone,
  zones,
  setSelectedZone,
  showHeatmap,
  showPOIs,
  getCategoryColor,
}: MapViewProps) => {
  const [mapKey, setMapKey] = useState(0);

  // Force map to refresh on zone change to fix sizing issues
  useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, [selectedZone.id]);

  // Handle map resizing when window resizes
  useEffect(() => {
    const handleResize = () => {
      const mapElement = document.querySelector(".leaflet-container");
      if (mapElement) {
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Map Container */}
      <Card className="overflow-hidden bg-slate-800 border-slate-700 h-[600px] lg:h-[700px]">
        <MapContainer
          key={mapKey}
          center={[selectedZone.lat, selectedZone.lng]}
          zoom={15}
          className="h-full w-full"
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />

          {/* Zone Markers */}
          {zones.map((zone) => (
            <div key={zone.id}>
              {/* Main Zone Marker */}
              <Marker
                position={[zone.lat, zone.lng]}
                icon={defaultIcon}
                eventHandlers={{
                  click: () => setSelectedZone(zone),
                }}
              >
                <Popup className="z-50">
                  <div className="text-sm min-w-[200px]">
                    <p className="font-bold text-slate-900">{zone.name}</p>
                    <p className="text-xs text-slate-600">
                      {zone.category}
                    </p>
                    <p className="text-xs text-slate-700 mt-1">
                      POIs: {zone.poiCount}
                    </p>
                    <p className="text-xs text-slate-700">
                      Traffic: {zone.trafficFlow}%
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Traffic Heatmap Layer */}
              {showHeatmap && (
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={1000 + zone.trafficFlow * 20}
                  pathOptions={{
                    fillColor: getTrafficColor(zone.trafficFlow),
                    fillOpacity: getTrafficOpacity(zone.trafficFlow),
                    color: getTrafficColor(zone.trafficFlow),
                    weight: 2,
                    opacity: 0.8,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">Traffic Heatmap</p>
                      <p className="text-xs text-slate-600">
                        Intensity: {zone.trafficFlow}%
                      </p>
                    </div>
                  </Popup>
                </Circle>
              )}

              {/* POI Layer - Show only for selected zone to avoid clutter */}
              {showPOIs && zone.id === selectedZone.id && (
                <>
                  {zone.pois.slice(0, 50).map((poi, index) => (
                    <Marker
                      key={`${poi.id}-${index}`}
                      position={[poi.position.lat, poi.position.lon]}
                      icon={poiIcon}
                    >
                      <Popup>
                        <div className="text-sm min-w-[180px]">
                          <p className="font-bold text-slate-900">
                            {poi.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {poi.type}
                          </p>
                          {poi.address && (
                            <p className="text-xs text-slate-700 mt-1">
                              {poi.address}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </div>
          ))}
        </MapContainer>
      </Card>

      {/* Map Legend */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-4">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#06B6D4" }} />
            <span className="text-xs text-slate-400">Zone Marker</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#EF4444" }}
            />
            <span className="text-xs text-slate-400">Severe Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#F97316" }}
            />
            <span className="text-xs text-slate-400">Heavy Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#22C55E" }}
            />
            <span className="text-xs text-slate-400">Clear Traffic</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Zone markers (blue) show POI hotspots. Colored circles represent traffic heatmaps.
          POI markers (small pins) appear only for the selected zone.
        </p>
      </Card>
    </div>
  );
};

export default MapView;
