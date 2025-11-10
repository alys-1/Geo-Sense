import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, AlertCircle, Users, Navigation } from "lucide-react";

interface Zone {
  id: number;
  name: string;
  category: "Commercial" | "Residential" | "Mixed-Use";
  lat: number;
  lng: number;
  poiCount: number;
  trafficFlow: number;
  confidence: number;
  pois: any[];
  poiBreakdown: {
    commercial: number;
    residential: number;
    services: number;
  };
  mobilityPattern: string;
  trafficRatio: number;
  dominantCategory: string;
}

interface AnalyticsViewProps {
  selectedZone: Zone;
}

// Mock 24-hour traffic pattern data
const mockTrafficData = [
  { time: "6 AM", traffic: 20 },
  { time: "7 AM", traffic: 35 },
  { time: "8 AM", traffic: 65 },
  { time: "9 AM", traffic: 78 },
  { time: "10 AM", traffic: 55 },
  { time: "11 AM", traffic: 45 },
  { time: "12 PM", traffic: 50 },
  { time: "1 PM", traffic: 48 },
  { time: "2 PM", traffic: 52 },
  { time: "3 PM", traffic: 58 },
  { time: "4 PM", traffic: 62 },
  { time: "5 PM", traffic: 72 },
  { time: "6 PM", traffic: 85 },
  { time: "7 PM", traffic: 78 },
  { time: "8 PM", traffic: 60 },
  { time: "9 PM", traffic: 35 },
  { time: "10 PM", traffic: 25 },
  { time: "12 AM", traffic: 15 },
];

const COLORS = {
  commercial: "#06B6D4",
  residential: "#10B981",
  services: "#F59E0B",
  traffic: "#EF4444",
  clear: "#22C55E",
};

const AnalyticsView = ({ selectedZone }: AnalyticsViewProps) => {
  // Prepare POI category distribution data
  const poiCategoryData = [
    {
      name: "Commercial",
      value: selectedZone.poiBreakdown.commercial,
      fill: COLORS.commercial,
    },
    {
      name: "Residential",
      value: selectedZone.poiBreakdown.residential,
      fill: COLORS.residential,
    },
    {
      name: "Services",
      value: selectedZone.poiBreakdown.services,
      fill: COLORS.services,
    },
  ].filter((item) => item.value > 0);

  // Prepare traffic intensity distribution (simulated)
  const trafficDistributionData = [
    {
      name: "Clear (0-20%)",
      value: 15,
      fill: COLORS.clear,
    },
    {
      name: "Light (21-40%)",
      value: 25,
      fill: "#84CC16",
    },
    {
      name: "Moderate (41-60%)",
      value: 30,
      fill: "#EAB308",
    },
    {
      name: "Heavy (61-80%)",
      value: 20,
      fill: "#F97316",
    },
    {
      name: "Severe (80%+)",
      value: 10,
      fill: COLORS.traffic,
    },
  ];

  // Prepare zone type distribution (simulated)
  const zoneTypeData = [
    { name: "Mon", commercial: 35, residential: 25, services: 40 },
    { name: "Tue", commercial: 38, residential: 28, services: 38 },
    { name: "Wed", commercial: 40, residential: 30, services: 35 },
    { name: "Thu", commercial: 42, residential: 32, services: 32 },
    { name: "Fri", commercial: 45, residential: 28, services: 30 },
    { name: "Sat", commercial: 32, residential: 35, services: 40 },
    { name: "Sun", commercial: 28, residential: 38, services: 42 },
  ];

  const totalPOIs = selectedZone.poiCount;
  const trafficIntensity = selectedZone.trafficFlow;
  const trafficRatio = (selectedZone.trafficRatio * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total POIs */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total POIs</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">
                {totalPOIs}
              </p>
            </div>
            <Users className="w-8 h-8 text-cyan-400 opacity-20" />
          </div>
        </Card>

        {/* Traffic Intensity */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Traffic Intensity</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">
                {trafficIntensity}%
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-400 opacity-20" />
          </div>
        </Card>

        {/* Traffic Ratio */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Traffic Ratio</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">
                {trafficRatio}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400 opacity-20" />
          </div>
        </Card>

        {/* Dominant Category */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Dominant Category</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {selectedZone.dominantCategory}
              </p>
            </div>
            <Navigation className="w-8 h-8 text-green-400 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POI Category Distribution - Pie Chart */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            POI Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={poiCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {poiCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#E2E8F0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Traffic Intensity Distribution - Pie Chart */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Traffic Intensity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {trafficDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#E2E8F0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Traffic Pattern Over 24 Hours */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            Traffic Pattern - 24 Hours
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
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

      {/* Zone Type Activity by Day */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            Zone Type Activity - Weekly Pattern
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={zoneTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid #475569",
              }}
              labelStyle={{ color: "#E2E8F0" }}
            />
            <Legend />
            <Bar dataKey="commercial" fill={COLORS.commercial} />
            <Bar dataKey="residential" fill={COLORS.residential} />
            <Bar dataKey="services" fill={COLORS.services} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Zone Statistics Summary */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Zone Statistics Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400 mb-2">Zone Name</p>
            <p className="text-white font-semibold">{selectedZone.name}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Zone Classification</p>
            <p className="text-white font-semibold">{selectedZone.category}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Confidence Score</p>
            <p className="text-white font-semibold">
              {(selectedZone.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Mobility Pattern</p>
            <p className="text-white font-semibold">
              {selectedZone.mobilityPattern}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Peak Traffic Hours</p>
            <p className="text-white font-semibold">5-6 PM</p>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Average Traffic</p>
            <p className="text-white font-semibold">
              {mockTrafficData
                .reduce((sum, d) => sum + d.traffic, 0)
                .toFixed(0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsView;
