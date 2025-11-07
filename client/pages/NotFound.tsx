import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg mb-6 mx-auto">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">Zone Not Found</h2>
        <p className="text-slate-400 mb-8">
          We couldn't find the location you're looking for. This area hasn't been mapped yet or may have been moved.
        </p>
        <Link to="/">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
