import React from 'react'
import { createCustomEqual } from "fast-equals"



function useDeepCompareEffectForMaps(
    callback,
    dependencies
) {
    React.useEffect(callback, dependencies.map(useDeepCompareMemoize))
}
function useDeepCompareMemoize(value) {
    const ref = React.useRef()

    if (!deepCompareEqualsForMaps(value, ref.current)) {
        ref.current = value
    }

    return ref.current
}
const deepCompareEqualsForMaps = createCustomEqual(
    (deepEqual) => (a, b) => {/*
        if (
        isLatLngLiteral(a) ||
        a instanceof google.maps.LatLng ||
        isLatLngLiteral(b) ||
        b instanceof google.maps.LatLng
        ) {
        return new google.maps.LatLng(a).equals(new google.maps.LatLng(b))
        }*/

        // TODO extend to other types

        // use fast-equals for other objects
        return deepEqual(a, b)
    }
)

export {deepCompareEqualsForMaps,useDeepCompareEffectForMaps,useDeepCompareMemoize}