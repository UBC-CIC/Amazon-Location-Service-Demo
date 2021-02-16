
import React, { Component } from 'react';
import Amplify from "aws-amplify";
import amplifyConfig from "./aws-exports";
import { Signer }  from '@aws-amplify/core'
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
import TextField from "@material-ui/core/TextField";
import {Button} from "@material-ui/core";
import {Auth} from 'aws-amplify';
import Location from "aws-sdk/clients/location"
import './AmznMap.css'
import Geojson from "./Geojson";
import Geofence from "./Geofence";
import {AmplifySignOut} from "@aws-amplify/ui-react";

let map;
let marker;
let AWS = require("aws-sdk");

const mapName = process.env.REACT_APP_MAP_NAME;
const placeIndex = process.env.REACT_APP_PLACE_INDEX_NAME;
const geoFenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;

AWS.config.region = amplifyConfig.aws_project_region;
Amplify.configure(amplifyConfig);

let credentials;
let locationService;
let geofenceArray = []


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

//Effects: getting current user credentials from AWS Cognito
async function getCurrentUser(){
    credentials = await Auth.currentCredentials();
    locationService = new AWS.Location({
        credentials,
        region: amplifyConfig.aws_project_region,
    });
}

//Effects: construct a container to render a map, add navigation control(zoom in and out button)
//from mapboxGL, add geolocate control (top right button to locate user location)
function constructMap(container){
    map = new mapboxgl.Map({
        container: container,
        center: [-123.14229959999999, 49.2194576 ], // initial map centerpoint
        zoom: 12, // initial map zoom
        style: mapName,
        transformRequest,
    });

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

}

//Effects: if user grant this app access to its current location, set the initial map location there
//Otherwise, the map's initial location will be Vancouver,BC Canada
function setInitialMapLocation(){
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position.coords.latitude, position.coords.longitude);
            map.flyTo({
                center: [position.coords.longitude,position.coords.latitude],
                essential: true,
            });
        });
    }
}

//Effects: Triggers when search button is pressed
//reads the location input, fires an API request to aws location services
//flies to the location found on the map view
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
                console.log(longitude)
                console.log(latitude)

            }
        }
    )
}

//Effects: make an api request to get the list of geofences under geoFenceCollection
//For each geofence found, store the geofenceID and coordinate as an instance of Geofence class
// into geofencceArray
function getGeofenceData() {
    return new Promise(function (resolve, reject) {
        locationService.listGeofences({CollectionName: geoFenceCollection}, (err, response) => {
            if (err) reject(err);
            if (response && response.Entries.length>0) {
                for (var i = 0; i < response.Entries.length; i++) {
                    let geofence = new Geofence(response.Entries[i].GeofenceId,response.Entries[i].Geometry.Polygon)
                    geofenceArray.push(geofence)
                }
                resolve(resolve)
            }
        });
    });
}

//Requires: calling getGeofenceData() first before calling this function
//Effects: render the geofence data stored in geofenceArray onto the map
function renderGeofence(){
    if(geofenceArray.length===0) {
        console.log("no geofence found, call getGeofenceData() or upload geofences on AWS")
        return
    }
    let geojson = new Geojson()
    map.once('load', function () {
        for(var i =0;i<geofenceArray.length;i++){
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
                    'fill-opacity': 0.8
                }
            });
        }
    });

}

function clearCache(){
    window.location.reload()
}

class AmznMap extends Component{
    constructor(props) {
        super(props);
        this.state = {
            text: ""
        };
    }

    async componentDidMount() {
        //get current user credentials
        await getCurrentUser();
        //make map
        constructMap(this.container)
        //set initial location of map view
        setInitialMapLocation();
        //get geofence data
        await getGeofenceData();
        //render the geofence data onto the map
        renderGeofence();

    }

    updateInputText=(e)=>{
        this.setState({
            text:e.target.value
        });
    }
    handleSubmit=()=>{
        searchAndUpdateMapview(map, this.state.text)
    }
    signOutClear=()=>{
        clearCache();
    }

    render(){
        return (
            <div id = {'mapPage'}>
                <AmplifySignOut onclick={this.signOutClear} />
                <div id={"sbContainer"}>
                    <TextField id="sbInput" label="Enter location" type="outlined" value={this.state.text} onChange={e=>this.updateInputText(e)}/>
                    <Button id={'searchBtn'} variant="outlined" color="secondary" onClick={this.handleSubmit} >
                        Search
                    </Button>
                </div>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }

}

export default AmznMap;
