const geoFenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;

export default class Geofence{
    geofenceId
    coordinates
    createTime
    status
    constructor(geofenceId, coordinates, createTime, status){
        this.geofenceId = geofenceId
        this.coordinates = coordinates
        this.createTime = createTime
        this.status = status
    }
    //Effects: make an api request to get the list of geofences under geoFenceCollection
//For each geofence found, store the geofenceID and coordinate as an instance of Geofence class
// into geofencceArray
        getGeofenceData(locationService, geofenceArray) {
        return new Promise(function (resolve, reject) {
            locationService.listGeofences({CollectionName: geoFenceCollection}, (err, response) => {
                if (err) reject(err);
                if (response && response.Entries.length>0) {
                    for (var i = 0; i < response.Entries.length; i++) {
                        let geofence = new Geofence(response.Entries[i].GeofenceId,response.Entries[i].Geometry.Polygon,
                            response.Entries[i].CreateTime, response.Entries[i].Status)
                        geofenceArray.push(geofence)
                    }
                    resolve(resolve)
                }
            });
        });
    }

}


