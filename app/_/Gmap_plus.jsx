import React from 'react'
import { Wrapper, Status } from "@googlemaps/react-wrapper"

import {deepCompareEqualsForMaps,useDeepCompareEffectForMaps,useDeepCompareMemoize} from './Gmap/hooks.js'

export default function Gmap({ 
    initialCenter = { lat: 5.748560, lng: -3.983372 }, // Default initial center
    initialZoom = 13, // Default initial zoom
    onCoordinatesClick // Add prop for callback
}) {
    const render = (status) => {
        return <h1>{status}</h1>
    }
    , [center, setCenter] = React.useState(initialCenter) // Use prop for initial center
    , [zoom, setZoom] = React.useState(initialZoom) // Use prop for initial zoom
    , [markerPosition, setMarkerPosition] = React.useState(null); // State for single marker

    const handleMapClick = (e) => {
        const clickedCoords = e.latLng.toJSON();
        console.log("Map clicked at:", clickedCoords);
        setMarkerPosition(clickedCoords); // Update marker position on click
        // Call the callback prop if it exists
        if (onCoordinatesClick) {
            onCoordinatesClick(clickedCoords);
        }
    }

    const onIdle = (m) => {
        console.log("onIdle")
        setZoom(m.getZoom())
        setCenter(m.getCenter().toJSON())
    }
    , ref = React.useRef(null)
    // , refMap = React.useRef(null)
    , [map, setMap] = React.useState()


    React.useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {}))
        }
    }, [ref, map])
    
    return <Wrapper 
        apiKey={"AIzaSyA91x3_pmeeoc1bwFWvj2dehOCBuH0VKcU"} 
        render={render}
    >
        <Map 
            center={center} 
            zoom={zoom} 
            onClick={handleMapClick} 
            onIdle={onIdle} 
        >
            {markerPosition && <Marker position={markerPosition} />} 
        </Map>
    </Wrapper>
}

const Map = ({
    onClick,
    onIdle,
    children,
    style,
    ...options
}) => {
    const ref = React.useRef(null);
    const [map, setMap] = React.useState()

    React.useEffect(() => {
        if (map) {
            ["click", "idle"].forEach((eventName) =>
                // google.maps.event.clearListeners(map, eventName)
                {}
            );
            if (onClick) {
                map.addListener("click", onClick)
            }
        
            if (onIdle) {
                map.addListener("idle", () => onIdle(map))
            }
        }
    }, [map, onClick, onIdle])

    useDeepCompareEffectForMaps(() => {
        if (map) {
          map.setOptions(options);
        }
      }, [map, options]);

    React.useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {}))
        }
    }, [ref, map])

    return <>
        <div id="map" ref={ref}  style={style} />
        {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            // set the map prop on the child component
            // @ts-ignore
            return React.cloneElement(child, { map })
        }
        })}
    </>
}

const Marker = (options) => {
    const [marker, setMarker] = React.useState();

    React.useEffect(() => {
        if (!marker) {
            const newMarker = new window.google.maps.Marker();
            setMarker(newMarker);
        }

        // Configurer le marqueur lorsqu'il est créé ou lorsque les options changent
        if (marker) {
            marker.setOptions(options);
        }

        // Nettoyer le marqueur lors du démontage
        return () => {
            if (marker) {
                marker.setMap(null);
            }
        };
    }, [marker, options]);

    return null;
};