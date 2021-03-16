import GeojsonHelper from "./GeojsonHelper";
import Geofence from "../Geofence/Geofence";
import {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
const geoFenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;
let AWS = require("aws-sdk");
let geofenceArray =[]
class GeofenceHelper{
    constructor() {
        this.geofenceArray =[]
    }
    //Effects: make an api request to get the list of geofences under geoFenceCollection
//For each geofence found, store the geofenceID and coordinate as an instance of Geofence class
// into geofencceArray
    async getGeofenceData() {
        return new Promise(async function (resolve, reject) {
            let credentials = await Auth.currentCredentials();
            let locationService = new AWS.Location({
                credentials,
                region: amplifyConfig.aws_project_region,
            });
            locationService.listGeofences({CollectionName: geoFenceCollection}, (err, response) => {
                if (err) reject(err);
                if (response && response.Entries.length>0) {
                    for (let i = 0; i < response.Entries.length; i++) {
                        let geofence = new Geofence(response.Entries[i].GeofenceId,response.Entries[i].Geometry.Polygon,
                            response.Entries[i].CreateTime, response.Entries[i].Status)
                        geofenceArray.push(geofence)
                    }
                    resolve(resolve)
                }
            });
        });
    }

    async listGeofence(){
        if(geofenceArray.length!==0){
            console.log(geofenceArray)
            return geofenceArray
        }else{
            await this.getGeofenceData()
            console.log(geofenceArray)
            return geofenceArray
        }
    }
    //Requires: calling getGeofenceData() first before calling this function
    //Effects: render the geofence data stored in geofenceArray onto the map
    async renderGeofence(map){
        await this.getGeofenceData()
        if(geofenceArray.length===0) {
            console.log("no geofence found, call getGeofenceData() or upload geofences on AWS")
            return
        }
        let geojson = new GeojsonHelper()
        map.once('load', function () {
            for(var i =0;i<geofenceArray.length;i++){
                if(map.getLayer(geofenceArray[i].geofenceId)) map.removeLayer(geofenceArray[i].geofenceId)
                if(map.getSource(geofenceArray[i].geofenceId)) map.removeSource(geofenceArray[i].geofenceId)

                map.addSource(geofenceArray[i].geofenceId, {
                    'type': 'geojson',
                    'data': geojson.geojsonFormatter(
                        geofenceArray[i].coordinates[0])
                });
                map.addLayer({
                    'id': geofenceArray[i].geofenceId,
                    'type': 'fill',
                    'source': geofenceArray[i].geofenceId,
                    'layout': {},
                    'paint': {
                        'fill-color': 'orange',
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'hover'], false],
                            1,
                            0.4
                        ]
                    }
                });
            }
        });

    }
}
export default GeofenceHelper;