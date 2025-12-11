import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number, locationName: string) => void;
}

function MapClickHandler({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lng: number) => void 
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function MapPickerDialog({
  isOpen,
  onOpenChange,
  initialLat,
  initialLng,
  onSelect,
}: MapPickerProps) {
  const defaultLat = 25.2854;
  const defaultLng = 51.5310;
  
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat ?? null);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng ?? null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationName, setLocationName] = useState<string>("");

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
        {
          headers: {
            "User-Agent": "KashtaApp/1.0 (trip planning app)"
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }
      
      const data = await response.json();
      
      if (data.address) {
        const region = data.address.state || 
                      data.address.region || 
                      data.address.county || 
                      data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      "";
        const country = data.address.country || "";
        
        if (region && country) {
          setLocationName(`${region}، ${country}`);
        } else if (country) {
          setLocationName(country);
        } else if (data.display_name) {
          const parts = data.display_name.split(",");
          setLocationName(parts.slice(0, 2).join("،").trim());
        } else {
          setLocationName("موقع محدد");
        }
      } else {
        setLocationName("موقع محدد");
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
      setLocationName("موقع محدد");
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedLat(initialLat ?? null);
      setSelectedLng(initialLng ?? null);
      setLocationName("");
      
      if (initialLat && initialLng) {
        reverseGeocode(initialLat, initialLng);
      }
    }
  }, [isOpen, initialLat, initialLng, reverseGeocode]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      const finalLocationName = locationName || "موقع محدد";
      onSelect(selectedLat, selectedLng, finalLocationName);
      onOpenChange(false);
    }
  };

  const centerLat = selectedLat ?? initialLat ?? defaultLat;
  const centerLng = selectedLng ?? initialLng ?? defaultLng;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>اختر الموقع على الخريطة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            اضغط على الخريطة لتحديد موقع الطلعة
          </p>
          
          <div className="h-[400px] w-full rounded-md overflow-hidden border" style={{ direction: "ltr" }}>
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={8}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              {selectedLat !== null && selectedLng !== null && (
                <>
                  <Marker position={[selectedLat, selectedLng]} icon={markerIcon} />
                  <RecenterMap lat={selectedLat} lng={selectedLng} />
                </>
              )}
            </MapContainer>
          </div>
          
          {selectedLat !== null && selectedLng !== null && (
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">الإحداثيات:</span>
                <span className="text-sm font-mono" dir="ltr">
                  {selectedLat.toFixed(6)}°, {selectedLng.toFixed(6)}°
                </span>
              </div>
              {isLoadingLocation ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري تحديد الموقع...</span>
                </div>
              ) : locationName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">الموقع:</span>
                  <span className="text-sm">{locationName}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedLat === null || selectedLng === null}
          >
            تأكيد الموقع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
