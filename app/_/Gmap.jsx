// npm install @googlemaps/react-wrapper
import React from 'react'
import { Wrapper, Status } from "@googlemaps/react-wrapper"

import {deepCompareEqualsForMaps,useDeepCompareEffectForMaps,useDeepCompareMemoize} from './Gmap/hooks.js'

const peerCoordinates = (value) => {
    
    // Vérifier si la valeur est une paire de coordonnées
    const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = value.match(coordsRegex);

    return match
}

export default function Gmap() {
    const render = (status) => {
        return <h1>{status}</h1>
    }
    , [departValue, setDepartValue] = React.useState("")
    , [doItineraireIsOn, setDoItineraireIsOn] = React.useState(false)
    , [center, setCenter] = React.useState({lat: 5.748560,lng: -3.983372,})
    , [itineraire, setItineraire] = React.useState([])
    , [zoom, setZoom] = React.useState(12) // initial zoom

    const handleMapClick = (e) => {
        console.log(doItineraireIsOn)
        console.log("\n\n\n"+'BEFORE:::Etat itineraire:', itineraire);
        if (doItineraireIsOn) {
            const newLatLng = e.latLng.toJSON()
            
            setItineraire([newLatLng, center])
            
            console.log('AFTER:::Etat itineraire:', itineraire, "\n\n\n");
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
        if(!doItineraireIsOn)
            setItineraire([])
        else 
            setItineraire([center])

            console.log("itineraire");
            console.log(itineraire);
    }, [doItineraireIsOn])

    React.useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {}))
        }
    }, [ref, map])
    
    const handleDepartChange = (event) => {
        const value = event.target.value;

        setDepartValue(value)
    };

    const handleDepartKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Empêche le formulaire de se soumettre

            const value = event.target.value
            , match = peerCoordinates(value)

            if (match) {
                // Si c'est une paire de coordonnées, mettre à jour l'itinéraire avec les coordonnées
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[3]);
                setItineraire(prevItineraire => [{lat, lng}, prevItineraire[1]]);
            } else {
                const geocoder = new google.maps.Geocoder()
                geocoder.geocode({ address: value }, (results, status) => {
                    if (status === 'OK') {
                        const lat = results[0].geometry.location.lat();
                        const lng = results[0].geometry.location.lng();
                        console.log("lat,lng");
                        console.log(lat,lng);
                        setItineraire(prevItineraire => [{ lat, lng }, prevItineraire[1]]);
                    } else {
                        console.error('Geocode was not successful for the following reason: ' + status);
                    }
                })
            }
        }
    }
    , clearDepartInput = (e) => {
        setItineraire(prevItineraire => {
            return [prevItineraire[1]]
        })
        setDepartValue("")
    };

    const handleArrowClick = (direction, field) => {
        const step = 0.000001; // Ajustez selon la précision souhaitée
        setCenter(prevCenter => ({
            ...prevCenter,
            [field]: Number((prevCenter[field] + (direction === 'up' ? step : -step)).toFixed(6))
        }));
    };

    return <Wrapper 
        apiKey={"AIzaSyA91x3_pmeeoc1bwFWvj2dehOCBuH0VKcU"} 
        render={render}
    >
        <Map 
            center={center} 
            zoom={zoom} 
            onClick={handleMapClick}
        >
            {itineraire.map((position, index) => (
                <Marker key={index} position={position} />
            ))}
        </Map>
        <section>
            {/* <form onSubmit={handleItineraireSubmit}>
                <button 
                    type="button"
                    className={doItineraireIsOn?"on":""}
                    onClick={() => {
                        setDoItineraireIsOn(!doItineraireIsOn)
                    }}
                    title="Définir un itinéraire jusqu'à le Sanctuaire Nd Rosaire Bolobi"
                >
                </button>
                <fieldset className={doItineraireIsOn ? 'on' : ''}>
                    <input 
                        type="text"
                        id="depart_input"
                        name="depart"
                        className="safe"
                        placeholder="Nom du lieu ou coordonnées (lat, lng)"
                        value={itineraire[1] ? itineraire[0].lat + ", " + itineraire[0].lng : departValue}
                        onChange={handleDepartChange}
                        onKeyDown={handleDepartKeyDown}
                    />
                    <label htmlFor="depart">Départ</label>
                </fieldset>
                <button 
                    type="button" 
                    className="clear-input"
                    onClick={clearDepartInput}
                >
                    x
                </button>
                <fieldset hidden>
                    <input 
                        type="text"
                        id="arrivee"
                        name="arrivee"
                        className="safe"
                        placeholder="Coordonnées d'arrivée"
                        value={`${center.lat}, ${center.lng}`}
                    />
                    <label htmlFor="arrivee">Arrivée</label>
                </fieldset>
            </form> */}
            {/* <fieldset>
              <div class="ps-controller">
                <div class="ps-arrows">
                  <button class="ps-arrow up" aria-label="Augmenter" onClick={() => handleArrowClick('up', 'lat')}></button>
                  <button class="ps-arrow down" aria-label="Diminuer" onClick={() => handleArrowClick('down', 'lat')}></button>
                </div>
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  className="safe"
                  value={center.lat}
                  onChange={(event) =>
                    setCenter({ ...center, lat: Number(event.target.value) })
                  }
                />
              </div>
              <label htmlFor="lat">Latitude</label>
            </fieldset>
            <fieldset>
              <div class="ps-controller">
                <div class="ps-arrows">
                  <button class="ps-arrow up" aria-label="Augmenter" onClick={() => handleArrowClick('up', 'lng')}></button>
                  <button class="ps-arrow down" aria-label="Diminuer" onClick={() => handleArrowClick('down', 'lng')}></button>
                </div>
                <input
                  type="number"
                  id="lng"
                  name="lng"
                  className="safe"
                  value={center.lng}
                  onChange={(event) =>
                    setCenter({ ...center, lng: Number(event.target.value) })
                  }
                />
              </div>
              <label htmlFor="lng">Longitude</label>
            </fieldset> */}
        </section>
    </Wrapper>
}

const handleItineraireSubmit = e => { 
    e.preventDefault()
    // alert('ok submitted')
    // setDoItineraireIsOn(!doItineraireIsOn)
}

/*
interface MapProps extends google.maps.MapOptions {
    style: { [key: string]: string };
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onIdle?: (map: google.maps.Map) => void;
}
*/
/*
const Map = ({
    onClick,
    onIdle,
    children,
    style,
    ...options
}) => <div ref={ref} style={style} />
*/

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