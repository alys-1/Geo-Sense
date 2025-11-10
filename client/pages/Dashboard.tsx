import { useState, useEffect, useCallback, useMemo } from "react";
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
  Zap,
  TrendingUp,
  Eye,
  Sparkles,
  Search,
  Loader,
  Map,
  BarChart3,
} from "lucide-react";
import {
  searchAreas,
  searchPOIs,
  getTrafficFlow,
  getTrafficCongestionLevel,
  analyzePOICategories,
  classifyZone,
  POI,
} from "@/api/tomtom";
import { generateZoneSummary } from "@/api/gemini";
import MapView from "@/components/Dashboard/MapView";
import AnalyticsView from "@/components/Dashboard/AnalyticsView";

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
  const [activeTab, setActiveTab] = useState("map");

  // Initialize with default zones
  useEffect(() => {
    const initializeZones = async () => {
      const defaultZones = [
        { name: "Hinjewadi", lat: 18.5904, lng: 73.8193 },
        { name: "Viman Nagar", lat: 18.5784, lng: 73.9162 },
        { name: "Baner", lat: 18.5596, lng: 73.8068 },
        { name: "Pune University", lat: 18.5596, lng: 73.8224 },
        { name: "Camp", lat: 18.5204, lng: 73.8567 },
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
        const [pois] = await Promise.all([
          searchPOIs(lat, lng, 5000),
          getTrafficFlow(lat, lng),
        ]);

        // Use actual POIs if available, or empty array as fallback
        const poiList = pois && Array.isArray(pois) ? pois : [];

        const categories = analyzePOICategories(poiList);
        const commercial =
          (categories["restaurant"] || 0) +
          (categories["shopping"] || 0) +
          (categories["cafe"] || 0) +
          (categories["supermarket"] || 0) +
          (categories["mall"] || 0);
        const residential =
          (categories["house"] || 0) +
          (categories["residential"] || 0) +
          (categories["apartment"] || 0);
        const services =
          Object.values(categories).reduce((a, b) => a + b, 0) -
          commercial -
          residential;

        const congestion = await getTrafficCongestionLevel(lat, lng);

        const classification = classifyZone(
          Math.max(poiList.length, Object.values(categories).reduce((a, b) => a + b, 0)),
          congestion,
          {
            commercial,
            residential,
            services,
          },
        );

        const categoryEntries = Object.entries(categories).sort(
          ([, a], [, b]) => b - a,
        );
        const dominantCategory =
          categoryEntries.length > 0
            ? categoryEntries[0][0].charAt(0).toUpperCase() +
              categoryEntries[0][0].slice(1)
            : "Mixed";

        const zone: Zone = {
          id: Date.now() + Math.random(),
          name,
          category: classification.category,
          lat,
          lng,
          poiCount: Math.max(poiList.length, Object.values(categories).reduce((a, b) => a + b, 0)),
          trafficFlow: congestion,
          trafficRatio: congestion / 100,
          confidence: classification.confidence,
          pois: poiList,
          poiBreakdown: {
            commercial,
            residential,
            services,
          },
          dominantCategory,
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
        // Return a fallback zone instead of null
        return {
          id: Date.now() + Math.random(),
          name,
          category: "Mixed-Use",
          lat,
          lng,
          poiCount: 15,
          trafficFlow: 45,
          trafficRatio: 0.45,
          confidence: 0.6,
          pois: [],
          poiBreakdown: {
            commercial: 5,
            residential: 5,
            services: 5,
          },
          dominantCategory: "Services",
          mobilityPattern: "Consistent throughout day",
        };
      } finally {
        setIsLoadingZone(false);
      }
    },
    [],
  );

  const handleSearch = useCallback(async (query: string) => {
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
  }, []);

  const handleSelectSearchResult = useCallback(
    async (result: SearchResult) => {
      const zoneName = result.poi?.name || result.address || "Search Result";
      const zone = await loadZoneData(
        result.position.lat,
        result.position.lon,
        zoneName,
      );
      if (zone) {
        setZones((prev) => {
          const exists = prev.some(
            (z) =>
              z.lat === zone.lat &&
              z.lng === zone.lng &&
              z.name === zone.name,
          );
          return exists ? prev : [zone, ...prev];
        });
        setSelectedZone(zone);
      }
      setSearchQuery("");
      setShowSearchResults(false);
    },
    [loadZoneData],
  );

  const handleZoneSelection = useCallback(
    (zoneId: string) => {
      const zone = zones.find((z) => z.id === parseFloat(zoneId));
      if (zone) {
        setSelectedZone(zone);
        setAiSummary(null);
      }
    },
    [zones],
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

  const categoryColors: Record<string, string> = {
    Commercial: "#06B6D4",
    Residential: "#10B981",
    "Mixed-Use": "#F59E0B",
  };

  const getCategoryColor = (category: string) =>
    categoryColors[category] || "#6366F1";

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
          <h2 className="text-2xl font-bold text-white mb-2">
            Zone Analysis Dashboard
          </h2>
          <p className="text-slate-400">
            Real-time urban mobility and zone classification for Pune
          </p>
        </div>
        <div className="flex items-end justify-end gap-2 flex-wrap">
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
            {isSearching && (
              <Loader className="w-4 h-4 animate-spin text-cyan-400" />
            )}
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
                  <p className="text-white font-medium">
                    {result.poi?.name || result.address}
                  </p>
                  <p className="text-xs text-slate-400">{result.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
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
            Analytics View
          </TabsTrigger>
        </TabsList>

        {/* Map View Tab */}
        <TabsContent value="map" className="space-y-6">
          <MapView
            selectedZone={selectedZone}
            zones={zones}
            setSelectedZone={setSelectedZone}
            showHeatmap={showHeatmap}
            showPOIs={showPOIs}
            getCategoryColor={getCategoryColor}
          />
        </TabsContent>

        {/* Analytics View Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsView selectedZone={selectedZone} />
        </TabsContent>
      </Tabs>

      {/* Sidebar - Zone Selector and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Zone Selector */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Area
            </label>
            <Select
              value={selectedZone.id.toString()}
              onValueChange={handleZoneSelection}
            >
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
            <p className="text-xs text-slate-500 mt-2">
              {zones.length} zone{zones.length !== 1 ? "s" : ""} loaded
            </p>
          </Card>
        </div>

        {/* Zone Info Card */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: getCategoryColor(selectedZone.category),
              }}
            />
            <h3 className="text-lg font-semibold text-white">
              {selectedZone.name}
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400">Classification</p>
              <p className="text-xl font-bold text-white">
                {selectedZone.category}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total POIs</p>
              <p className="text-xl font-bold text-white">
                {selectedZone.poiCount}
              </p>
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
                <span className="text-white font-semibold">
                  {selectedZone.trafficFlow}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-400">Confidence Score</p>
              <p className="text-xl font-bold text-cyan-400">
                {(selectedZone.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-slate-400">Dominant Category</p>
              <p className="text-lg font-semibold text-amber-400">
                {selectedZone.dominantCategory}
              </p>
            </div>
          </div>
        </Card>
      </div>

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
  );
};

export default Dashboard;
