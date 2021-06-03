import GeojsonHelper from "./GeojsonHelper";
import Geofence from "../Geofence/Geofence";
import {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
import {Component} from "react";
let AWS = require("aws-sdk");
const geofenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;

class GeofenceHelper extends Component{
    constructor(props) {
        super(props);
        this.state={
            geofenceArray:[]
        }
    }
    async getGeofenceData() {
        let geofenceArray = []
        let credentials = await Auth.currentCredentials();
        let locationService = new AWS.Location({
                credentials,
                region: amplifyConfig.aws_project_region,
        });
        locationService.listGeofences({CollectionName: geofenceCollection}, (err, response) => {
            if (err) console.log(err);
            if (response && response.Entries.length>0) {
                for (let i = 0; i < response.Entries.length; i++) {
                    let geofence = new Geofence(response.Entries[i].GeofenceId,response.Entries[i].Geometry.Polygon,
                        response.Entries[i].CreateTime, response.Entries[i].Status)
                    geofenceArray.push(geofence)
                }
            }
            this.setState({
                geofenceArray:geofenceArray
            })
        });
    }

}
export default GeofenceHelper;