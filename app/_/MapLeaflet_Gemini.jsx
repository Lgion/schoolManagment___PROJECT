'use client'

import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useRef } from 'react'

// Correction du problème d'icône Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Component to handle map events
function MapEvents({ onMapClick, setMarkerPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log(`Map clicked at: ${lat}, ${lng}`);
      setMarkerPosition([lat, lng]); // Update local marker state
      if (onMapClick) {
        onMapClick(e.latlng); // Call the callback prop with latlng object
      }
    },
  });
  return null; // This component doesn't render anything itself
}

export default function MapLeaflet({ initialPosition = [51.505, -0.09], onMapClick }) { 
    const [isMounted, setIsMounted] = useState(false);
    const [markerPosition, setMarkerPosition] = useState(initialPosition); 
    const [mapCenter, setMapCenter] = useState(initialPosition); 
    const mapRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            if (mapRef.current) {
                try {
                  mapRef.current.off(); // Remove all event listeners
                  mapRef.current.remove(); // Destroy the map instance
                  console.log("Leaflet map instance cleaned up.");
                } catch (error) {
                  console.error("Error cleaning up Leaflet map:", error);
                }
                mapRef.current = null; // Clear the ref
            }
        };
    }, []);

    useEffect(() => {
        if (
            Array.isArray(initialPosition) && initialPosition.length === 2 &&
            (initialPosition[0] !== markerPosition[0] || initialPosition[1] !== markerPosition[1])
        ) {
            console.log("Updating marker position from prop:", initialPosition);
            setMarkerPosition(initialPosition);
            setMapCenter(initialPosition); 
        }
    }, [initialPosition]); 

    if (!isMounted) {
        return <div style={{ height: '400px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>Loading map...</div>; 
    }

    const isValidPosition = pos => 
        Array.isArray(pos) && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]);

    const currentCenter = isValidPosition(mapCenter) ? mapCenter : [0, 0]; 
    const currentMarkerPos = isValidPosition(markerPosition) ? markerPosition : null; 

    return (
        <div style={{ height: "400px", width: "100%" }}>
            <MapContainer 
                whenCreated={mapInstance => { mapRef.current = mapInstance; }} 
                key={JSON.stringify(currentCenter)} 
                center={currentCenter} 
                zoom={13} 
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {currentMarkerPos && (
                    <Marker position={currentMarkerPos}>
                        <Popup>
                            Coordinates: <br /> Lat: {currentMarkerPos[0]?.toFixed(5)}, Lng: {currentMarkerPos[1]?.toFixed(5)}
                        </Popup>
                    </Marker>
                )}
                <MapEvents onMapClick={onMapClick} setMarkerPosition={setMarkerPosition} />
            </MapContainer>
        </div>
    );
}