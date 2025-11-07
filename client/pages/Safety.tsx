import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, MapPin, AlertTriangle, Share2, Phone, Loader, CheckCircle } from "lucide-react";
import { calculateRoute } from "@/api/tomtom";

interface SafeRoute {
  id: string;
  name: string;
  startPoint: { lat: number; lon: number };
  endPoint: { lat: number; lon: number };
  safetyScore: number; // 0-100
  distance: number;
  duration: number;
  riskFactors: string[];
  polyline?: Array<{ latitude: number; longitude: number }>;
}

const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Safety = () => {
  const [routes, setRoutes] = useState<SafeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [mapCenter] = useState<[number, number]>([18.5204, 73.8567]);

  const generateSafeRoute = useCallback(async () => {
    if (!startPoint.trim() || !endPoint.trim()) {
      alert("Please enter both start and end points");
      return;
    }

    setIsLoading(true);
    try {
      // Sample coordinates for demo
      const startCoords = { lat: 18.5596, lon: 73.8068 }; // Baner
      const endCoords = { lat: 18.5204, lon: 73.8567 }; // Pune City

      const routeData = await calculateRoute(
        startCoords.lat,
        startCoords.lon,
        endCoords.lat,
        endCoords.lon,
        "fastest"
      );

      const newRoute: SafeRoute = {
        id: `route_${Date.now()}`,
        name: `Safe Route: ${startPoint} → ${endPoint}`,
        startPoint: startCoords,
        endPoint: endCoords,
        safetyScore: 78 + Math.random() * 15, // 78-93
        distance: routeData.summary.lengthInMeters / 1000,
        duration: routeData.summary.travelTimeInSeconds / 60,
        riskFactors: [
          "Well-lit streets",
          "High foot traffic",
          "Near police station",
          "Good mobile connectivity",
        ],
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

  const addContact = useCallback(() => {
    if (!newContact.trim()) return;
    setContacts([...contacts, newContact]);
    setNewContact("");
  }, [newContact, contacts]);

  const removeContact = useCallback(
    (index: number) => {
      setContacts(contacts.filter((_, i) => i !== index));
    },
    [contacts]
  );

  const shareViaWhatsApp = useCallback(async () => {
    if (!selectedRoute) return;

    setIsSharing(true);
    try {
      const message = `🛡️ Safety Alert - Live Location Tracking\n\nRoute: ${selectedRoute.name}\nSafety Score: ${selectedRoute.safetyScore.toFixed(0)}/100\nDistance: ${selectedRoute.distance.toFixed(2)} km\nETA: ${selectedRoute.duration.toFixed(0)} min\n\nI'm sharing my live location on this safe route. My coordinates:\nhttps://maps.google.com/?q=${selectedRoute.startPoint.lat},${selectedRoute.startPoint.lon}\n\nEmergency Contact: 112`;

      const encodedMessage = encodeURIComponent(message);

      // Open WhatsApp with pre-filled message
      if (contacts.length > 0) {
        // For demo: show success message instead of actually opening WhatsApp
        alert(`WhatsApp sharing ready!\n\n${message}\n\nContacts: ${contacts.join(", ")}`);
      } else {
        alert("Please add at least one contact to share with.");
      }
    } finally {
      setIsSharing(false);
    }
  }, [selectedRoute, contacts]);

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Green
    if (score >= 60) return "#F59E0B"; // Amber
    return "#EF4444"; // Red
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Safe Route Recommender</h2>
        <p className="text-slate-400">Find the safest routes and share live location with trusted contacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-slate-800 border-slate-700 h-[500px]">
            <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {selectedRoute && (
                <>
                  <Marker position={[selectedRoute.startPoint.lat, selectedRoute.startPoint.lon]} icon={defaultIcon}>
                    <Popup>Start: {selectedRoute.name}</Popup>
                  </Marker>
                  <Marker position={[selectedRoute.endPoint.lat, selectedRoute.endPoint.lon]} icon={defaultIcon}>
                    <Popup>End: {selectedRoute.name}</Popup>
                  </Marker>
                  {selectedRoute.polyline && (
                    <Polyline
                      positions={selectedRoute.polyline.map((p) => [p.latitude, p.longitude])}
                      pathOptions={{
                        color: getSafetyColor(selectedRoute.safetyScore),
                        weight: 4,
                        opacity: 0.9,
                      }}
                    />
                  )}
                </>
              )}
            </MapContainer>
          </Card>

          {/* Route Details */}
          {selectedRoute && (
            <Card className="mt-6 bg-slate-800 border-slate-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRoute.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">Safety-optimized route</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: getSafetyColor(selectedRoute.safetyScore) }}>
                    {selectedRoute.safetyScore.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400">Safety Score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-slate-400 text-sm">Distance</p>
                  <p className="text-xl font-bold text-white">{selectedRoute.distance.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Duration</p>
                  <p className="text-xl font-bold text-white">{selectedRoute.duration.toFixed(0)} min</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Risk Level</p>
                  <p className="text-xl font-bold text-green-400">LOW</p>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm font-medium text-white mb-3">Safety Features</p>
                <ul className="space-y-2">
                  {selectedRoute.riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>

        {/* Safety Panel */}
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Plan Safe Route</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
                <Input
                  placeholder="Starting point"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
                <Input
                  placeholder="Destination"
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>

              <Button
                onClick={generateSafeRoute}
                disabled={isLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Finding Safe Route...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Generate Safe Route
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Emergency Contacts */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-orange-400" />
              <h4 className="text-sm font-semibold text-white">Emergency Contacts</h4>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Name or phone"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 text-sm"
                />
                <Button
                  onClick={addContact}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700 p-2 rounded text-sm text-slate-300">
                    <span>{contact}</span>
                    <button
                      onClick={() => removeContact(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Share via WhatsApp */}
          {selectedRoute && (
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-semibold text-white">Share Live Location</h4>
              </div>

              <p className="text-sm text-slate-300 mb-4">
                Share your route and safety score with trusted contacts via WhatsApp.
              </p>

              <Button
                onClick={shareViaWhatsApp}
                disabled={isSharing || contacts.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isSharing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share via WhatsApp
                  </>
                )}
              </Button>

              {contacts.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">Add contacts to enable sharing</p>
              )}
            </Card>
          )}

          {/* Emergency Info */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-white mb-2">Emergency Numbers</p>
                <div className="space-y-1 text-xs text-slate-300">
                  <p>🚨 Police: 100</p>
                  <p>🚑 Ambulance: 102</p>
                  <p>📞 General: 112</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Safety;
