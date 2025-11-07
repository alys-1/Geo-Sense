import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, TrendingUp, AlertCircle, Eye, Sparkles, Search, Loader } from "lucide-react";
import { searchAreas, searchPOIs, getTrafficFlow, getTrafficCongestionLevel, analyzePOICategories, classifyZone } from "@/api/tomtom";
import { generateZoneSummary } from "@/api/gemini";

interface Zone {
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

interface SearchResult {
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

const mockTrafficData = [
  { time: "6 AM", traffic: 20 },
  { time: "9 AM", traffic: 78 },
  { time: "12 PM", traffic: 45 },
  { time: "3 PM", traffic: 52 },
  { time: "6 PM", traffic: 85 },
  { time: "9 PM", traffic: 35 },
  { time: "12 AM", traffic: 15 },
];

const categoryColors: Record<string, string> = {
  Commercial: "#06B6D4",
  Residential: "#10B981",
  "Mixed-Use": "#F59E0B",
};

const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Dashboard = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingZone, setIsLoadingZone] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize with default zones
  useEffect(() => {
    const initializeZones = async () => {
      const defaultZones = [
        { name: "Hinjewadi", lat: 18.5904, lng: 73.8193 },
        { name: "Viman Nagar", lat: 18.5784, lng: 73.9162 },
        { name: "Baner", lat: 18.5596, lng: 73.8068 },
      ];

      const loadedZones: Zone[] = [];
      for (const zone of defaultZones) {
        const zoneData = await loadZoneData(zone.lat, zone.lng, zone.name);
        if (zoneData) {
          loadedZones.push(zoneData);
        }
      }

      setZones(loadedZones);
      if (loadedZones.length > 0) {
        setSelectedZone(loadedZones[0]);
      }
    };

    initializeZones();
  }, []);

  const loadZoneData = useCallback(
    async (lat: number, lng: number, name: string): Promise<Zone | null> => {
      try {
        setIsLoadingZone(true);
        const [pois, trafficData] = await Promise.all([
          searchPOIs(lat, lng, 5000),
          getTrafficFlow(lat, lng),
        ]);

        const categories = analyzePOICategories(pois);
        const commercial = categories["restaurant"] || categories["shopping"] || 0;
        const residential = categories["house"] || categories["residential"] || 0;
        const services = Object.values(categories).reduce((a, b) => a + b, 0) - commercial - residential;

        const congestion = await getTrafficCongestionLevel(lat, lng);

        const classification = classifyZone(pois.length, congestion, {
          commercial,
          residential,
          services,
        });

        const zone: Zone = {
          id: Date.now(),
          name,
          category: classification.category,
          lat,
          lng,
          poiCount: pois.length,
          trafficFlow: congestion,
          confidence: classification.confidence,
          poiBreakdown: {
            commercial,
            residential,
            services,
          },
          mobilityPattern:
            congestion > 70
              ? "High-traffic business hours"
              : congestion > 50
                ? "Consistent throughout day"
                : "Peak morning and evening commute",
        };

        return zone;
      } catch (error) {
        console.error("Error loading zone data:", error);
        return null;
      } finally {
        setIsLoadingZone(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchAreas(query);
        setSearchResults(results.slice(0, 8));
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSelectSearchResult = useCallback(
    async (result: SearchResult) => {
      const zoneName = result.poi?.name || result.address || "Search Result";
      const zone = await loadZoneData(result.position.lat, result.position.lon, zoneName);
      if (zone) {
        setZones((prev) => [zone, ...prev]);
        setSelectedZone(zone);
      }
      setSearchQuery("");
      setShowSearchResults(false);
    },
    [loadZoneData]
  );

  const handleExplainWithGemini = async () => {
    if (!selectedZone) return;
    setIsLoadingSummary(true);
    try {
      const summary = await generateZoneSummary({
        zoneName: selectedZone.name,
        category: selectedZone.category,
        poiCount: selectedZone.poiCount,
        trafficIntensity: selectedZone.trafficFlow,
        confidenceScore: selectedZone.confidence,
        mobilityPattern: selectedZone.mobilityPattern,
      });
      setAiSummary(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setAiSummary("Unable to generate insights at this moment.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const getCategoryColor = (category: string) => categoryColors[category] || "#6366F1";

  if (!selectedZone) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading zone data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Zone Analysis Dashboard</h2>
          <p className="text-slate-400">Real-time urban mobility and zone classification for Pune</p>
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Traffic Heatmap
          </Button>
          <Button
            variant={showPOIs ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPOIs(!showPOIs)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            POI Layer
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="relative">
          <div className="flex gap-2 items-center">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search for areas or landmarks in Pune..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
            {isSearching && <Loader className="w-4 h-4 animate-spin text-cyan-400" />}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-600 border-b border-slate-600 last:border-b-0 transition-colors"
                >
                  <p className="text-white font-medium">{result.poi?.name || result.address}</p>
                  <p className="text-xs text-slate-400">{result.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-slate-800 border-slate-700 h-[500px]">
            <MapContainer center={[selectedZone.lat, selectedZone.lng]} zoom={15} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {zones.map((zone) => (
                <div key={zone.id}>
                  <Marker
                    position={[zone.lat, zone.lng]}
                    icon={defaultIcon}
                    eventHandlers={{
                      click: () => setSelectedZone(zone),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{zone.name}</p>
                        <p className="text-xs text-slate-600">{zone.category}</p>
                        <p className="text-xs">{zone.poiCount} POIs</p>
                      </div>
                    </Popup>
                  </Marker>
                  {showHeatmap && (
                    <Circle
                      center={[zone.lat, zone.lng]}
                      radius={800 + zone.trafficFlow * 20}
                      pathOptions={{
                        fillColor: getCategoryColor(zone.category),
                        fillOpacity: 0.15,
                        color: getCategoryColor(zone.category),
                        weight: 1,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
              ))}
            </MapContainer>
          </Card>

          {/* Traffic Over Time */}
          <Card className="mt-6 bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Traffic Pattern - 24h</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#E2E8F0" }}
                />
                <Line
                  type="monotone"
                  dataKey="traffic"
                  stroke="#06B6D4"
                  dot={{ fill: "#06B6D4" }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Zone Selector */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Recent Zones</label>
            <Select value={selectedZone.id.toString()} onValueChange={(id) => {
              const zone = zones.find(z => z.id === parseInt(id));
              if (zone) setSelectedZone(zone);
            }}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Zone Analytics */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryColor(selectedZone.category) }}
              />
              <h3 className="text-lg font-semibold text-white">{selectedZone.name}</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Classification</p>
                <p className="text-xl font-bold text-white">{selectedZone.category}</p>
              </div>
              <div>
                <p className="text-slate-400">Total POIs</p>
                <p className="text-xl font-bold text-white">{selectedZone.poiCount}</p>
              </div>
              <div>
                <p className="text-slate-400">Traffic Intensity</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${selectedZone.trafficFlow}%` }}
                    />
                  </div>
                  <span className="text-white font-semibold">{selectedZone.trafficFlow}%</span>
                </div>
              </div>
              <div>
                <p className="text-slate-400">Confidence Score</p>
                <p className="text-xl font-bold text-cyan-400">{(selectedZone.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </Card>

          {/* POI Breakdown Chart */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h4 className="text-sm font-semibold text-white mb-4">POI Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[selectedZone.poiBreakdown]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#E2E8F0" }}
                />
                <Bar dataKey="commercial" fill="#06B6D4" />
                <Bar dataKey="residential" fill="#10B981" />
                <Bar dataKey="services" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-3">Mobility: {selectedZone.mobilityPattern}</p>
          </Card>

          {/* Gemini AI Summary */}
          <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-700/50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">AI Insights</h4>
            </div>
            {aiSummary ? (
              <p className="text-sm text-slate-300 mb-4">{aiSummary}</p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                Click the button below to get AI-powered insights about this zone.
              </p>
            )}
            <Button
              onClick={handleExplainWithGemini}
              disabled={isLoadingSummary}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              {isLoadingSummary ? "Analyzing..." : "Explain with Gemini"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
