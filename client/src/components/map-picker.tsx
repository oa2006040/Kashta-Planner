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
import { useLanguage } from "@/components/language-provider";

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
  const { t, language } = useLanguage();
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
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language}`,
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
      const separator = language === "ar" ? "، " : ", ";
      const defaultLocation = language === "ar" ? "موقع محدد" : "Selected location";
      
      if (data.address) {
        const city = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.hamlet ||
                     data.address.suburb ||
                     "";
        const region = data.address.state || 
                      data.address.region || 
                      data.address.county || 
                      "";
        const country = data.address.country || "";
        
        const locationParts = [city, region, country].filter(part => part && part.trim());
        const uniqueParts = locationParts.filter((part, index) => 
          locationParts.indexOf(part) === index
        );
        
        if (uniqueParts.length > 0) {
          setLocationName(uniqueParts.join(separator));
        } else if (data.display_name) {
          const parts = data.display_name.split(",");
          setLocationName(parts.slice(0, 3).join(separator).trim());
        } else {
          setLocationName(defaultLocation);
        }
      } else {
        setLocationName(defaultLocation);
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
      setLocationName(language === "ar" ? "موقع محدد" : "Selected location");
    } finally {
      setIsLoadingLocation(false);
    }
  }, [language]);

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
      const finalLocationName = locationName || (language === "ar" ? "موقع محدد" : "Selected location");
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
          <DialogTitle>{t("اختر الموقع على الخريطة", "Choose location on map")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("اضغط على الخريطة لتحديد موقع الطلعة", "Click on the map to select trip location")}
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
                <span className="text-sm font-medium">{t("الإحداثيات:", "Coordinates:")}</span>
                <span className="text-sm font-mono" dir="ltr">
                  {selectedLat.toFixed(6)}°, {selectedLng.toFixed(6)}°
                </span>
              </div>
              {isLoadingLocation ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("جاري تحديد الموقع...", "Locating...")}</span>
                </div>
              ) : locationName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t("الموقع:", "Location:")}</span>
                  <span className="text-sm">{locationName}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("إلغاء", "Cancel")}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedLat === null || selectedLng === null}
          >
            {t("تأكيد الموقع", "Confirm location")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
