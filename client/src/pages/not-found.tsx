import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
      <div className="glass-panel p-12 rounded-2xl text-center max-w-md w-full border-red-900/50">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold mb-2 font-display text-white">404</h1>
        <p className="text-gray-400 mb-8">This sector of the grid does not exist.</p>
        <Link href="/" className="inline-block bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors">
          Return to Base
        </Link>
      </div>
    </div>
  );
}
