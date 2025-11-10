import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader,
  Map,
  BarChart3,
  Brain,
  Zap,
  AlertCircle,
} from "lucide-react";
import MapView from "@/components/Dashboard/MapView";
import AnalyticsView from "@/components/Dashboard/AnalyticsView";
import ModelInsightsPanel from "@/components/Dashboard/ModelInsightsPanel";
import { flaskML, ZoneAnalysis } from "@/api/flask_ml";

interface ZoneData {
  id: number;
  analysis: ZoneAnalysis | null;
  timestamp: Date;
}

const DEFAULT_LOCATIONS = [
  { name: "Hinjewadi, Pune", lat: 18.5904, lng: 73.8193 },
  { name: "Viman Nagar, Pune", lat: 18.5784, lng: 73.9162 },
  { name: "Baner, Pune", lat: 18.5596, lng: 73.8068 },
  { name: "Pune University, Pune", lat: 18.5596, lng: 73.8224 },
  { name: "Camp, Pune", lat: 18.5204, lng: 73.8567 },
];

const MLDashboard = () => {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedZones, setSelectedZones] = useState<ZoneData[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latInput, setLatInput] = useState("18.5904");
  const [lngInput, setLngInput] = useState("73.8193");
  const [radiusInput, setRadiusInput] = useState("1000");
  const [selectedLocation, setSelectedLocation] = useState("Hinjewadi, Pune");
  const [error, setError] = useState<string | null>(null);

  // Auto-load default zones on mount
  useEffect(() => {
    const loadDefaultZones = async () => {
      const firstZone = DEFAULT_LOCATIONS[0];
      await analyzeLocation(firstZone.lat, firstZone.lng, 1000);
    };
    loadDefaultZones();
  }, []);

  const analyzeLocation = useCallback(
    async (lat: number, lon: number, radius: number = 1000) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const analysis = await flaskML.analyzeZone(lat, lon, radius);

        const newZone: ZoneData = {
          id: Date.now(),
          analysis,
          timestamp: new Date(),
        };

        setSelectedZones((prev) => [newZone, ...prev.slice(0, 9)]);
        setSelectedZoneId(newZone.id);
      } catch (err: any) {
        setError(`Error analyzing zone: ${err.message}`);
        console.error("Analysis error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    const loc = DEFAULT_LOCATIONS.find((l) => l.name === locationName);
    if (loc) {
      setLatInput(loc.lat.toString());
      setLngInput(loc.lng.toString());
      analyzeLocation(loc.lat, loc.lng, parseInt(radiusInput) || 1000);
    }
  };

  const handleCustomAnalysis = async () => {
    try {
      const lat = parseFloat(latInput);
      const lon = parseFloat(lngInput);
      const radius = parseInt(radiusInput) || 1000;

      if (isNaN(lat) || isNaN(lon)) {
        setError("Invalid coordinates");
        return;
      }

      await analyzeLocation(lat, lon, radius);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedZone =
    selectedZones.find((z) => z.id === selectedZoneId)?.analysis || null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            ML Zone Classification System
          </h2>
          <p className="text-slate-400">
            AI-powered geographic zone analysis using K-Means & Random Forest
          </p>
        </div>
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-900/30 border border-cyan-700/50 rounded-lg">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">
              {selectedZones.length} zone
              {selectedZones.length !== 1 ? "s" : ""} analyzed
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-900/20 border-red-700 p-4">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Control Panel */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Zone Selection & Analysis
        </h3>
        <div className="space-y-4">
          {/* Quick Location Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quick Location
            </label>
            <Select value={selectedLocation} onValueChange={handleLocationSelect}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {DEFAULT_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.name} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Latitude
              </label>
              <Input
                type="number"
                step="0.0001"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="18.5904"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Longitude
              </label>
              <Input
                type="number"
                step="0.0001"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="73.8193"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Radius (meters)
              </label>
              <Input
                type="number"
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="1000"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleCustomAnalysis}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Analyzing Zone...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Zone
              </>
            )}
          </Button>
        </div>
      </Card>

      {selectedZone && (
        <>
          {/* Zone Results Header */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Zone Type */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Zone Classification</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        selectedZone.zone_classification.zone_color,
                    }}
                  />
                  <p className="text-2xl font-bold text-white">
                    {selectedZone.zone_classification.zone_type}
                  </p>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Confidence Score</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {(selectedZone.zone_classification.confidence * 100).toFixed(
                    1
                  )}
                  %
                </p>
              </div>

              {/* POI Count */}
              <div>
                <p className="text-slate-400 text-sm mb-2">POI Count</p>
                <p className="text-2xl font-bold text-green-400">
                  {selectedZone.features.poi_count}
                </p>
              </div>
            </div>

            {/* Zone Type Probabilities */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Zone Type Probabilities</p>
              <div className="space-y-2">
                {Object.entries(selectedZone.zone_classification.probabilities).map(
                  ([zoneType, probability]) => (
                    <div key={zoneType} className="flex items-center gap-3">
                      <span className="text-slate-300 min-w-24">{zoneType}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${(probability as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-300 min-w-12 text-right">
                        {((probability as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
              <TabsTrigger
                value="map"
                className="gap-2 data-[state=active]:bg-cyan-600"
              >
                <Map className="w-4 h-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-2 data-[state=active]:bg-cyan-600"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="ml_insights"
                className="gap-2 data-[state=active]:bg-cyan-600"
              >
                <Brain className="w-4 h-4" />
                ML Insights
              </TabsTrigger>
            </TabsList>

            {/* Map View */}
            <TabsContent value="map" className="space-y-6">
              <p className="text-slate-400 text-sm">
                POI distribution and traffic heatmap for {selectedZone.features.dominant_category}
              </p>
            </TabsContent>

            {/* Analytics View */}
            <TabsContent value="analytics" className="space-y-6">
              <p className="text-slate-400 text-sm">
                Zone feature distribution and traffic patterns
              </p>
            </TabsContent>

            {/* ML Insights */}
            <TabsContent value="ml_insights" className="space-y-6">
              <ModelInsightsPanel selectedZone={selectedZone} />
            </TabsContent>
          </Tabs>

          {/* Zone Features Details */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Engineered Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(selectedZone.features.values).map(([key, value]) => (
                <div key={key} className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 capitalize mb-1">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-lg font-semibold text-cyan-400">
                    {typeof value === "number" ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Traffic Data */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Traffic Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Traffic Ratio</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {selectedZone.traffic.traffic_ratio.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Current Speed</p>
                <p className="text-2xl font-bold text-amber-400">
                  {selectedZone.traffic.current_speed?.toFixed(1) || "N/A"} km/h
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Free Flow Speed</p>
                <p className="text-2xl font-bold text-green-400">
                  {selectedZone.traffic.free_flow_speed?.toFixed(1) || "N/A"} km/h
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Confidence</p>
                <p className="text-2xl font-bold text-blue-400">
                  {selectedZone.traffic.confidence || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Analyses */}
          {selectedZones.length > 1 && (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Analyses
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedZoneId === zone.id
                        ? "bg-cyan-900/30 border border-cyan-700"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {zone.analysis?.zone_classification.zone_type}
                        </p>
                        <p className="text-xs text-slate-400">
                          ({zone.analysis?.location.lat.toFixed(4)},{" "}
                          {zone.analysis?.location.lon.toFixed(4)})
                        </p>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            zone.analysis?.zone_classification.zone_color,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MLDashboard;
