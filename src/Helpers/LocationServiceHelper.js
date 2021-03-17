import amplifyConfig from "../aws-exports";
import {Signer} from "@aws-amplify/core";
import {Auth} from "aws-amplify";
import mapboxgl from "mapbox-gl";
let credentials;
const mapName = process.env.REACT_APP_MAP_NAME;

//Effects: request to load map resource from amazon location service
function transformRequest(url, resourceType) {
    if (resourceType === "Style" && !url.includes("://")) {
        // resolve to an AWS URL
        url = `https://maps.geo.${amplifyConfig.aws_project_region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
    }
    if (url.includes("amazonaws.com")) {
        // only sign AWS requests (with the signature as part of the query string)
        return {
            url: Signer.signUrl(url, {
                access_key: credentials.accessKeyId,
                secret_key: credentials.secretAccessKey,
                session_token: credentials.sessionToken,
            }),
        };
    }
    // Don't sign
    return { url: url || "" };
}

class LocationServiceHelper {
    //create a map instance with center location, then return it
    async constructMapWithCenter(container, center) {
        credentials = await Auth.currentCredentials();
        let map = new mapboxgl.Map({
            container: container,
            center: center,
            zoom: 10,
            style: mapName,
            transformRequest,
        });

        return map
    }

    //render the geofence on the map using an array of coordinates
    //bound the map view to the polygon
    renderGeofence(map, coordinates, id){
        map.on('load',function(){
            if(map.getLayer(id)) map.removeLayer(id)
            if(map.getSource(id)) map.removeSource(id)
        })
        map.on('load', function () {
            map.addSource(id, {
                'type': 'geojson',
                'data': {'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [coordinates]
                    }
                }
            });
            map.addLayer({
                'id': id,
                'type': 'fill',
                'source': id,
                'layout': {},
                'paint': {
                    'fill-color': '#4db2fa',
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        1,
                        0.4
                    ]
                }
            });
        });
    }

}

export default LocationServiceHelper