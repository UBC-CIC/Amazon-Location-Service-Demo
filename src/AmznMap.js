
import React, { Component } from 'react';
import Amplify from "aws-amplify";
import amplifyConfig from "./aws-exports";
import { Signer }  from '@aws-amplify/core'
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
import TextField from "@material-ui/core/TextField";
import {Button} from "@material-ui/core";
import Location from "aws-sdk/clients/location"
import './AmznMap.css'


Amplify.configure(amplifyConfig);
console.log(process.env.MAP_NAME)
const mapName = "newMap";
const placeIndex = "MyPlaceIndex";
var AWS = require("aws-sdk");
const identityPoolId = amplifyConfig.aws_cognito_identity_pool_id;
AWS.config.region = amplifyConfig.aws_project_region;
const credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
});
const locationService = new AWS.Location({
    credentials,
    region: amplifyConfig.aws_project_region,
});


let map;
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
let sidebar;
function searchAndUpdate(map, text){
    let longtitude = -123.11335999999994;
    let latitude = 49.260380000000055;
    console.log(text)
    if(text===""){
        console.log("No input text");
        return;
    }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            longtitude = position.coords.longitude
            latitude = position.coords.latitude
        })};
    locationService.searchPlaceIndexForText(
        {
            IndexName: placeIndex,
            Text: text,
            MaxResults: 1,
            BiasPosition: [longtitude, latitude]
        },
        (err, response) => {
            if (err) {
                console.error(err);
            }
            if (response) {
                longtitude = response.Summary.ResultBBox[0]
                latitude = response.Summary.ResultBBox[1]
                map.flyTo({
                    center: [longtitude, latitude],
                    essential: true,
                    zoom: 12,
                });
                console.log(longtitude)
                console.log(latitude)

            }
        }
    )
}

function initialMapLocation(){
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position.coords.latitude, position.coords.longitude);
            map.flyTo({
                center: [position.coords.longitude,position.coords.latitude],
                essential: true,
            });
        });
    } else { return; }

}

class AmznMap extends Component{
    constructor(props) {
        super(props);
        this.state = {
            text: ""
        };
    }

    async componentDidMount(){
        await credentials.getPromise();

        // actually initialize the map
        map = new mapboxgl.Map({
            container: this.container,
            center: [-123.1187, 49.2819], // initial map centerpoint
            zoom: 10, // initial map zoom
            style: mapName,
            transformRequest,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-left");
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            })
        );
        var marker = new mapboxgl.Marker()
            .setLngLat([-123.1187, 49.2819])
            .addTo(map);



        initialMapLocation()
    }
    updateInputText=(e)=>{
        this.setState({
            text:e.target.value
        });
    }
    handleSubmit=()=>{
        searchAndUpdate(map, this.state.text)
    }

    render(){
        return (
            <div>
                <TextField id="sbInput" label="Enter location" type="outlined" value={this.state.text} onChange={e=>this.updateInputText(e)}/>
                <Button id={'searchBtn'} variant="outlined" color="secondary" onClick={this.handleSubmit} >
                    Search
                </Button>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }

}

export default AmznMap;
