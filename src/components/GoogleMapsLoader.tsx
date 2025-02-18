import React from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { AlertTriangle, Loader2 } from "lucide-react";

const libraries: (
  | "places"
  | "drawing"
  | "geometry"
  | "localContext"
  | "visualization"
)[] = ["places", "geometry"];

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "territory-management-map",
    googleMapsApiKey: apiKey,
    libraries,
    version: "weekly",
    language: "en",
    region: "US",
  });

  if (loadError) {
    return (
      <div className="w-full h-[700px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-red-600">
            Failed to load Google Maps
            <p className="mt-2 text-sm">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[700px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <div className="text-gray-600">Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default React.memo(GoogleMapsLoader);
