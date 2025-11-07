import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";

const Events = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Event Impact Tracker</h2>
        <p className="text-slate-400">Monitor traffic changes near major events and venues</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg mb-6">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Track real-time traffic impact of events, concerts, sports matches, and other activities happening across Pune.
        </p>
        <div className="space-y-3 text-left max-w-md mx-auto mb-6">
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>Live event monitoring</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>Traffic predictions for events</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>Historical impact analysis</span>
          </div>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          View Feature Details
        </Button>
      </Card>
    </div>
  );
};

export default Events;
