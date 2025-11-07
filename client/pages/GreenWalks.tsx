import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Leaf,
  ArrowRight,
  MapPin,
  Clock,
  AlertCircle,
  Loader,
} from "lucide-react";
import { calculateRoute } from "@/api/tomtom";

interface WalkRoute {
  id: string;
  name: string;
  startPoint: { lat: number; lon: number };
  endPoint: { lat: number; lon: number };
  distance: number;
  duration: number;
  trafficLevel: "low" | "medium" | "high";
  difficulty: "easy" | "moderate" | "hard";
  polyline?: Array<{ latitude: number; longitude: number }>;
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

const GreenWalks = () => {
  const [routes, setRoutes] = useState<WalkRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<WalkRoute | null>(null);
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter] = useState<[number, number]>([18.5204, 73.8567]);

  const generateWalkRoute = useCallback(async () => {
    if (!startPoint.trim() || !endPoint.trim()) {
      alert("Please enter both start and end points");
      return;
    }

    setIsLoading(true);
    try {
      // Sample coordinates for demo - in production, would use actual search coordinates
      const startCoords = { lat: 18.5596, lon: 73.8068 }; // Baner area
      const endCoords = { lat: 18.5204, lon: 73.8567 }; // Pune City Center

      const routeData = await calculateRoute(
        startCoords.lat,
        startCoords.lon,
        endCoords.lat,
        endCoords.lon,
        "fastest",
      );

      const newRoute: WalkRoute = {
        id: `route_${Date.now()}`,
        name: `Walk from ${startPoint} to ${endPoint}`,
        startPoint: startCoords,
        endPoint: endCoords,
        distance: routeData.summary.lengthInMeters / 1000, // Convert to km
        duration: routeData.summary.travelTimeInSeconds / 60, // Convert to minutes
        trafficLevel: "low",
        difficulty: "easy",
        polyline: routeData.legs[0].points,
      };

      setRoutes([newRoute, ...routes]);
      setSelectedRoute(newRoute);
      setStartPoint("");
      setEndPoint("");
    } catch (error) {
      console.error("Error generating route:", error);
      alert("Could not generate route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startPoint, endPoint, routes]);

  const trafficColors = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Green Walk Finder
        </h2>
        <p className="text-slate-400">
          Discover calm, low-traffic walking routes through Pune
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-slate-800 border-slate-700 h-[500px]">
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {selectedRoute && (
                <>
                  <Marker
                    position={[
                      selectedRoute.startPoint.lat,
                      selectedRoute.startPoint.lon,
                    ]}
                    icon={defaultIcon}
                  >
                    <Popup>
                      Start:{" "}
                      {selectedRoute.name.split(" from ")[1]?.split(" to ")[0]}
                    </Popup>
                  </Marker>
                  <Marker
                    position={[
                      selectedRoute.endPoint.lat,
                      selectedRoute.endPoint.lon,
                    ]}
                    icon={defaultIcon}
                  >
                    <Popup>End: {selectedRoute.name.split(" to ")[1]}</Popup>
                  </Marker>
                  {selectedRoute.polyline && (
                    <Polyline
                      positions={selectedRoute.polyline.map((p) => [
                        p.latitude,
                        p.longitude,
                      ])}
                      pathOptions={{
                        color: trafficColors[selectedRoute.trafficLevel],
                        weight: 3,
                        opacity: 0.8,
                      }}
                    />
                  )}
                  <Circle
                    center={[
                      selectedRoute.startPoint.lat,
                      selectedRoute.startPoint.lon,
                    ]}
                    radius={200}
                    pathOptions={{
                      fillColor: trafficColors[selectedRoute.trafficLevel],
                      fillOpacity: 0.3,
                      color: trafficColors[selectedRoute.trafficLevel],
                      weight: 2,
                    }}
                  />
                </>
              )}
            </MapContainer>
          </Card>

          {/* Route Details */}
          {selectedRoute && (
            <Card className="mt-6 bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedRoute.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Distance</p>
                  <p className="text-xl font-bold text-white">
                    {selectedRoute.distance.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Duration</p>
                  <p className="text-xl font-bold text-white">
                    {selectedRoute.duration.toFixed(0)} min
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Traffic Level</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: trafficColors[selectedRoute.trafficLevel] }}
                  >
                    {selectedRoute.trafficLevel.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Difficulty</p>
                  <p className="text-xl font-bold text-white capitalize">
                    {selectedRoute.difficulty}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                ✓ Scenic route with parks and greenery
                <br />✓ Pedestrian-friendly streets
                <br />✓ Well-lit areas for evening walks
              </p>
            </Card>
          )}
        </div>

        {/* Route Generator */}
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Plan Your Walk
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  From
                </label>
                <Input
                  placeholder="Starting point (e.g., Baner)"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To
                </label>
                <Input
                  placeholder="Destination (e.g., Oswald Park)"
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>

              <Button
                onClick={generateWalkRoute}
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Finding Routes...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Generate Route
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Recent Routes */}
          {routes.length > 0 && (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h4 className="text-sm font-semibold text-white mb-3">
                Recent Routes
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRoute?.id === route.id
                        ? "bg-green-500/20 border border-green-500"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {route.name}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-slate-400">
                      <span>{route.distance.toFixed(1)} km</span>
                      <span>•</span>
                      <span>{route.duration.toFixed(0)} min</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white mb-2">Walking Tips</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Best time: Early morning or evening</li>
                  <li>✓ Wear comfortable shoes</li>
                  <li>✓ Stay on marked routes</li>
                  <li>✓ Travel in groups for safety</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GreenWalks;
