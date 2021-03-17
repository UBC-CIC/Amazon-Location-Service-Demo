import React, { Component } from 'react';
import Amplify, {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
import Location from "aws-sdk/clients/location";
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
import TextField from "@material-ui/core/TextField";
import {Button} from "@material-ui/core";
import './MapPage.css'
import GeojsonHelper from "../Helpers/GeojsonHelper";
import MapboxDraw from "@mapbox/mapbox-gl-draw/index";
import GeofenceHelper from "../Helpers/GeofenceHelper";
import LocationServiceHelper from '../Helpers/LocationServiceHelper'
let map;
let marker;
let credentials;
let locationService;
let draw;

const XRegExp = require('xregexp');
const AWS = require("aws-sdk");
const placeIndex = process.env.REACT_APP_PLACE_INDEX_NAME;
const geoFenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;
const geojsonHelper = new GeojsonHelper()
const geofenceHelper = new GeofenceHelper()
const locationHelper = new LocationServiceHelper()
Amplify.configure(amplifyConfig);


//Getting current user credentials
async function getLocationService(){
    credentials = await Auth.currentCredentials();
    locationService = new AWS.Location({
        credentials,
        region: amplifyConfig.aws_project_region,
    });
}

//Construct a container to render a map, add navigation (zoom in and out button),
//geolocate(top right button to locate user location) control and drawl tools
async function constructMap(container){
    map = await locationHelper.constructMapWithCenter(container,[-123.14229959999999, 49.2194576 ])
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
        })
    );

    marker = new mapboxgl.Marker()
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls:{
            polygon:true,
            trash:true
        }
    });
    map.addControl(draw)

}

//Triggers when search button is pressed
//reads the content from the search bar, makes an API request to location services
//flies to the location found on the map view.
function searchAndUpdateMapview(map, text){
    let longitude = -123.11335999999994;
    let latitude = 49.260380000000055;
    if(text===""){
        console.log("No input text");
        return
    }
    locationService.searchPlaceIndexForText(
        {
            IndexName: placeIndex,
            Text: text,
            MaxResults: 1,
            BiasPosition: [longitude, latitude]
        },
        (err, response) => {
            if (err) {
                console.error(err)
            }
            else if (response&&response.Results.length>0) {
                longitude = response.Summary.ResultBBox[0]
                latitude = response.Summary.ResultBBox[1]
                marker.setLngLat([longitude, latitude])
                marker.addTo(map)
                map.flyTo({
                    center: [longitude, latitude],
                    essential: true,
                    zoom: 12,
                });
            }
        }
    )
}



//add geofence to aws
function addGeofence(map, geofenceId){
    const polygon = draw.getAll()
    const regex = new XRegExp("^[-._\\s\\p{L}\\p{N}]+$")
    if(geofenceId === "") alert("Geofence ID input is empty")
    else if(polygon.features.length===0) alert('Please draw exactly 1 geofence on the map')
    else if(polygon.features.length>1) alert('Please decrease the number of geofence on the map to 1')
    //if geofenceID contains symbols other than -._
    else if(!regex.test(geofenceId)) {alert("Please enter valid characters")}
    else {
        //replace space character with -
        let newGeofenceId = geofenceId.replace(/\s+/g, '-')
        let coordinates = polygon.features[0].geometry.coordinates[0]
        let params = {
            CollectionName: geoFenceCollection, /* required */
            GeofenceId: newGeofenceId, /* required */
            Geometry: { /* required */
                Polygon: [geojsonHelper.determinePolygonOrientation(coordinates)]
            }
        };
        locationService.putGeofence(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(data)
                window.location.href= '/geofence'

            }
        });
    }
}

class MapPage extends Component{
    constructor(props) {
        super(props);
        this.state = {
            searchBarText: "",
            geofenceIdText:""
        };
    }

    async componentDidMount() {
        //get current user credentials
        await getLocationService();
        //make map
        await constructMap(this.container)
        //render the geofence data onto the map
        await geofenceHelper.renderGeofence(map);
    }

    updateInputText=(e)=>{
        this.setState({
            searchBarText:e.target.value
        });
    }
    updateGeofenceIdText=(e)=>{
        this.setState(({
            geofenceIdText:e.target.value
        }))
    }
    handleSearch=()=>{
        searchAndUpdateMapview(map, this.state.searchBarText)
    }
    //go to geofencePage
    geofencePage=()=>{
        window.location.href = '/geofence'
    }
    //calling to add geofence in aws
    addGeofence=()=>{
        addGeofence(map, this.state.geofenceIdText)
    }

    render(){
        return (
            <div id = {'mapPage'}>
                <div id={"sbContainer"}>
                    <TextField id="textInput" label="Enter location" type="outlined" value={this.state.text} onChange={e=>this.updateInputText(e)}/>
                    <Button id={'navBtn'} variant="outlined" color="secondary" onClick={this.handleSearch} >
                        Search
                    </Button>
                    <TextField id="textInput" label="Enter a unique geofence name" type="outlined" value={this.state.text} onChange={e=>this.updateGeofenceIdText(e)}/>
                    <Button id={'navBtn'} variant="outlined" color="secondary" onClick={this.addGeofence} >
                        Add geofence
                    </Button>
                    <Button id={'navBtn'} variant={'outlined'}color={'secondary'} onClick={this.geofencePage}>
                        List Geofence
                    </Button>
            </div>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }
}
export default MapPage;
