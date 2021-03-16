

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

}


