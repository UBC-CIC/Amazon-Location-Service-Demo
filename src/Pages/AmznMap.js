
import React, { Component } from 'react';
import Amplify, {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
import { Signer }  from '@aws-amplify/core'
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
import TextField from "@material-ui/core/TextField";
import {Button} from "@material-ui/core";
import './AmznMap.css'
import GeojsonHelper from "../Helpers/GeojsonHelper";
import Geofence from "../Geofence/Geofence";
import {AmplifySignOut} from "@aws-amplify/ui-react";
import MapboxDraw from "@mapbox/mapbox-gl-draw/index";
import { Link } from 'react-router-dom';
import GeofenceHelper from "../Helpers/GeofenceHelper";
import locationServiceHelper from '../Helpers/LocationServiceHelper'
let map;
let marker;
let AWS = require("aws-sdk");
let credentials;
let geofenceArray = []
var draw
let geojsonFormat = new GeojsonHelper()

const mapName = process.env.REACT_APP_MAP_NAME;
const placeIndex = process.env.REACT_APP_PLACE_INDEX_NAME;
const geoFenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;
const geofenceHelper = new GeofenceHelper()
const locationHelper = new locationServiceHelper()
let locationService;
Amplify.configure(amplifyConfig);


//Effects: getting current user credentials from AWS Cognito
async function getLocationService(){
    credentials = await Auth.currentCredentials();
    locationService = new AWS.Location({
        credentials,
        region: amplifyConfig.aws_project_region,
    });
}

//Effects: construct a container to render a map, add navigation control(zoom in and out button)
//from mapboxGL, add geolocate control (top right button to locate user location)
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
    let draw = new MapboxDraw({
        displayControlsDefault: false,
        controls:{
            polygon:true,
            trash:true
        }
    });
    map.addControl(draw)

}

//Effects: Triggers when search button is pressed
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



//clear cache when user decided to log out
//to avoid the geofence map layer loading more than once
function clearCache(){
    window.location.reload(false)
}

function addGeofence(map, geofenceId){
    const polygon = draw.getAll()
    if(geofenceId === "") alert("Geofence ID input is empty")
    else if(polygon.features.length===0) alert('Please draw exactly 1 geofence on the map')
    else if(polygon.features.length>1) alert('Please decrease the number of geofence on the map to 1')
    else {
        let coordinates = polygon.features[0].geometry.coordinates[0]
        let params = {
            CollectionName: geoFenceCollection, /* required */
            GeofenceId: geofenceId, /* required */
            Geometry: { /* required */
                Polygon: [geojsonFormat.determinePolygonOrientation(coordinates)]
            }
        };
        locationService.putGeofence(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
        });
        window.location.reload()
    }
}

class AmznMap extends Component{
    constructor(props) {
        super(props);
        this.state = {
            searchBarText: "",
            geofenceIdInput:""
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
    updateGeofenceInput=(e)=>{
        this.setState(({
            geofenceIdInput:e.target.value
        }))
    }
    handleSubmit=()=>{
        searchAndUpdateMapview(map, this.state.searchBarText)
    }
    signOutClear=()=>{
        clearCache();
    }
    geofencePage=()=>{
        window.location.href = '/geofence'
    }
    printData=()=>{
        addGeofence(map, this.state.geofenceIdInput)
    }

    render(){
        return (
            <div id = {'mapPage'}>
                <AmplifySignOut onclick={this.signOutClear}/>
                <div id={"sbContainer"}>
                    <TextField id="textInput" label="Enter location" type="outlined" value={this.state.text} onChange={e=>this.updateInputText(e)}/>
                    <Button id={'navBtn'} variant="outlined" color="secondary" onClick={this.handleSubmit} >
                        Search
                    </Button>
                    <TextField id="textInput" label="Enter a unique geofence name" type="outlined" value={this.state.text} onChange={e=>this.updateGeofenceInput(e)}/>
                    <Button id={'navBtn'} variant="outlined" color="secondary" onClick={this.printData} >
                        Add geofence
                    </Button>
                    <Link to="/geofence">
                    <Button id={'navBtn'} variant={'outlined'}color={'secondary'} onClick={this.geofencePage}>
                        List Geofence
                    </Button>
                    </Link>
            </div>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }
}
export default AmznMap;
