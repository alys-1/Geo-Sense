import { Outlet, Link, useLocation } from "react-router-dom";
import { MapPin, Leaf, Shield, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MainLayout = () => {
  const location = useLocation();

  const tabs = [
    { path: "/", label: "Dashboard", icon: MapPin },
    { path: "/green-walks", label: "Green Walks", icon: Leaf },
    { path: "/safety", label: "Safety", icon: Shield },
    { path: "/events", label: "Events", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GeoSense</h1>
                <p className="text-xs text-cyan-400">Pune Intelligence</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <nav className="flex gap-1 border-t border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2",
                    isActive
                      ? "text-cyan-400 border-cyan-400 bg-slate-800/50"
                      : "text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/25",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            GeoSense © 2024 • Real-time urban mobility and safety analysis for
            Pune
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
