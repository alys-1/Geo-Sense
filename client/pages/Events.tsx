import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, TrendingUp, Users, Clock, MapPin, Loader } from "lucide-react";

interface Event {
  id: string;
  name: string;
  venue: {
    lat: number;
    lon: number;
  };
  type: "concert" | "sports" | "festival" | "conference";
  date: string;
  expectedAttendees: number;
  trafficImpact: "low" | "medium" | "high" | "critical";
  affectedRadius: number;
  startTime: string;
  endTime: string;
}

interface TrafficImpactData {
  time: string;
  normal: number;
  withEvent: number;
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

const Events = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([
    {
      id: "1",
      name: "Pune Music Festival 2024",
      venue: { lat: 18.5204, lon: 73.8567 },
      type: "festival",
      date: "Dec 15, 2024",
      expectedAttendees: 25000,
      trafficImpact: "critical",
      affectedRadius: 2000,
      startTime: "6:00 PM",
      endTime: "11:00 PM",
    },
    {
      id: "2",
      name: "Maharashtra vs Karnataka Cricket",
      venue: { lat: 18.5529, lon: 73.8331 },
      type: "sports",
      date: "Dec 18, 2024",
      expectedAttendees: 15000,
      trafficImpact: "high",
      affectedRadius: 1500,
      startTime: "2:00 PM",
      endTime: "6:00 PM",
    },
    {
      id: "3",
      name: "Tech Conference 2024",
      venue: { lat: 18.5904, lon: 73.8193 },
      type: "conference",
      date: "Dec 20, 2024",
      expectedAttendees: 5000,
      trafficImpact: "medium",
      affectedRadius: 1000,
      startTime: "9:00 AM",
      endTime: "5:00 PM",
    },
  ]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(upcomingEvents[0]);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [mapCenter] = useState<[number, number]>([18.5204, 73.8567]);

  const trafficImpactData: TrafficImpactData[] = [
    { time: "2 PM", normal: 35, withEvent: 85 },
    { time: "3 PM", normal: 45, withEvent: 92 },
    { time: "4 PM", normal: 52, withEvent: 95 },
    { time: "5 PM", normal: 78, withEvent: 98 },
    { time: "6 PM", normal: 85, withEvent: 99 },
    { time: "7 PM", normal: 65, withEvent: 85 },
    { time: "8 PM", normal: 50, withEvent: 72 },
  ];

  const impactColors = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
    critical: "#8B0000",
  };

  const createAlertForEvent = useCallback(() => {
    if (!selectedEvent) return;
    setIsCreatingAlert(true);
    setTimeout(() => {
      alert(`✓ Alert created for "${selectedEvent.name}"\n\nYou'll receive notifications:\n• 24 hours before\n• 1 hour before\n• At event start time\n\nRoute alternatives will be suggested.`);
      setIsCreatingAlert(false);
    }, 1000);
  }, [selectedEvent]);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Event Impact Tracker</h2>
        <p className="text-slate-400">Monitor traffic changes near major events and venues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-slate-800 border-slate-700 h-[500px]">
            <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {upcomingEvents.map((event) => (
                <div key={event.id}>
                  <Marker
                    position={[event.venue.lat, event.venue.lon]}
                    icon={defaultIcon}
                    eventHandlers={{
                      click: () => setSelectedEvent(event),
                    }}
                  >
                  </Marker>
                  <Circle
                    center={[event.venue.lat, event.venue.lon]}
                    radius={event.affectedRadius}
                    pathOptions={{
                      fillColor: impactColors[event.trafficImpact],
                      fillOpacity: 0.2,
                      color: impactColors[event.trafficImpact],
                      weight: 2,
                      opacity: 0.6,
                      dashArray: "5, 5",
                    }}
                  />
                </div>
              ))}
            </MapContainer>
          </Card>

          {/* Traffic Impact Analysis */}
          {selectedEvent && (
            <Card className="mt-6 bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Predicted Traffic Impact</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trafficImpactData}>
                  <defs>
                    <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" label={{ value: "Traffic %", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid #475569",
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="normal"
                    stroke="#06B6D4"
                    fillOpacity={1}
                    fill="url(#normalGrad)"
                    name="Normal Traffic"
                  />
                  <Area
                    type="monotone"
                    dataKey="withEvent"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#eventGrad)"
                    name="With Event"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          {/* Event List */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedEvent?.id === event.id
                      ? "bg-amber-500/20 border border-amber-500"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getImpactIcon(event.trafficImpact)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.name}</p>
                      <p className="text-xs text-slate-400">{event.date}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Event Details */}
          {selectedEvent && (
            <>
              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-xs">Event Type</p>
                    <p className="text-white font-semibold capitalize">{selectedEvent.type}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Date & Time</p>
                    <p className="text-white font-semibold">{selectedEvent.date}</p>
                    <p className="text-sm text-slate-400">
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Expected Attendees</p>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Users className="w-4 h-4 text-blue-400" />
                      {selectedEvent.expectedAttendees.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs">Traffic Impact Radius</p>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <MapPin className="w-4 h-4 text-red-400" />
                      {selectedEvent.affectedRadius / 1000} km
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">Impact Level</p>
                    <div
                      className="px-3 py-1 rounded-full text-center text-white font-bold uppercase text-sm"
                      style={{ backgroundColor: impactColors[selectedEvent.trafficImpact] + "33" }}
                    >
                      {selectedEvent.trafficImpact}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Create Alert */}
              <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">Set Traffic Alert</h4>
                </div>

                <p className="text-sm text-slate-300 mb-4">
                  Get notified about traffic conditions around this event and receive alternate route suggestions.
                </p>

                <Button
                  onClick={createAlertForEvent}
                  disabled={isCreatingAlert}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isCreatingAlert ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Creating Alert...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Create Traffic Alert
                    </>
                  )}
                </Button>
              </Card>

              {/* Recommendations */}
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h4 className="text-sm font-semibold text-white mb-3">Recommendations</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>✓ Avoid the event area 2 hours before and after</li>
                  <li>✓ Use alternate routes via Eastern Bypass</li>
                  <li>✓ Consider public transport (PMPML buses)</li>
                  <li>✓ Peak traffic expected 5-8 PM</li>
                  <li>✓ Plan extra 30-45 mins for travel</li>
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
