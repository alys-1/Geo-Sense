import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight } from "lucide-react";

const GreenWalks = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Green Walk Finder</h2>
        <p className="text-slate-400">Discover calm, low-traffic walking routes through Pune</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg mb-6">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Green Walk Finder will help you discover peaceful walking routes with minimal traffic, perfect for morning jogs and evening strolls through Pune.
        </p>
        <div className="space-y-3 text-left max-w-md mx-auto mb-6">
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-green-400" />
            <span>Real-time traffic avoidance</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-green-400" />
            <span>Scenic route recommendations</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <ArrowRight className="w-4 h-4 text-green-400" />
            <span>Safety metrics along routes</span>
          </div>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white">
          View Feature Details
        </Button>
      </Card>
    </div>
  );
};

export default GreenWalks;
