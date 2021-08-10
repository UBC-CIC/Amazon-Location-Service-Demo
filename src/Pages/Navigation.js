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
import Geofence from "../Geofence/Geofence";
import {Marker} from "mapbox-gl";
let map;
let credentials;
let locationService;
let draw;
const AWS = require("aws-sdk");
const placeIndex = process.env.REACT_APP_PLACE_INDEX_NAME;
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
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
        })
    );


}





class Navigation extends Component{
    constructor(props) {
        super(props);
        this.state = {
            departurePoint: "",
            endingPoint:"",
            departureCoords:null,
            destinationCoords:null
        };
    }

    async componentDidMount() {
        //get current user credentials
        await getLocationService();
        //make map
        await constructMap(this.container)

    }

    updateInputText=(e)=>{
        this.setState({
            [e.target.id]:e.target.value
        });
    }
    handleSearch=async () => {
        console.log(this.state.departurePoint)
        this.searchCoords("departureCoords",this.state.departurePoint)
       this.searchCoords("destinationCoords",this.state.endingPoint)





    }
    searchCoords= (name,text) => {

        let longitude = -123.11335999999994;
        let latitude = 49.260380000000055;
         locationService.searchPlaceIndexForText(
            {
                IndexName: process.env.REACT_APP_PLACE_INDEX_NAME,
                Text: text,
                MaxResults: 1,
                BiasPosition: [longitude, latitude]
            },
            (err, response) => {
                if (err) {
                    console.error(err)
                } else if (response && response.Results.length > 0) {
                    let marker = new Marker()
                    console.log(response)
                    longitude = response.Summary.ResultBBox[0]
                    latitude = response.Summary.ResultBBox[1]
                    marker.setLngLat([longitude, latitude])
                    marker.addTo(map)
                    map.flyTo({
                        center: [longitude, latitude],
                        essential: true,
                        zoom: 12,
                    });
                    this.setState({
                        [name]:[longitude, latitude]
                    })
                }
            }
        )
    }
    handleRoute=()=>{
        console.log(this.state.destinationCoords)
        this.calculateRoute()
    }

    calculateRoute=()=> {
        var params = {
            CalculatorName: process.env.REACT_APP_ROUTE_CALCULATOR, /* required */
            DeparturePosition: [this.state.departureCoords[0], this.state.departureCoords[1]],
            DestinationPosition: [this.state.destinationCoords[0], this.state.destinationCoords[1]],
            //     CarModeOptions: {
            //         AvoidFerries: true || false,
            //         AvoidTolls: true || false
            //     },
            //     DepartNow: true || false,
            //     DepartureTime: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
            //     DistanceUnit: Kilometers | Miles,
            //     IncludeLegGeometry: true || false,
            //     TravelMode: Car | Truck | Walking,
            //     TruckModeOptions: {
            //         AvoidFerries: true || false,
            //         AvoidTolls: true || false,
            //         Dimensions: {
            //             Height: 'NUMBER_VALUE',
            //             Length: 'NUMBER_VALUE',
            //             Unit: Meters | Feet,
            //             Width: 'NUMBER_VALUE'
            //         },
            //         Weight: {
            //             Total: 'NUMBER_VALUE',
            //             Unit: Kilograms | Pounds
            //         }
            //     },
            //     WaypointPositions: [
            //         [
            //             'NUMBER_VALUE',
            //             /* more items */
            //         ],
            //         /* more items */
            //     ]
        };
        console.log(params)
        locationService.calculateRoute(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                var coordinates = []
                console.log(data);           // successful response
                data.Legs[0].Steps.map((item) => {
                    coordinates.push(item.StartPosition)
                    coordinates.push(item.EndPosition)

                })
                console.log(coordinates)

                    map.addSource('route', {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': coordinates
                            }
                        }
                    });
                    map.addLayer({
                        'id': 'route',
                        'type': 'line',
                        'source': 'route',
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': 'black',
                            'line-width': 8
                        }
                    });

                }})
    }

    render(){
        return (
            <div id = {'mapPage'}>
                <div id={"sbContainer"}>
                    <TextField id="departurePoint" label="Enter starting point" type="outlined" value={this.state.departurePoint} onChange={e=>this.updateInputText(e)}/>
                    <TextField id="endingPoint" label="Enter destination" type="outlined" value={this.state.endingPoint} onChange={e=>this.updateInputText(e)}/>

                    <Button id={'navBtn'} variant="contained" color="primary" onClick={this.handleSearch} >
                        Search
                    </Button>
                    {(this.state.destinationCoords&&this.state.departureCoords)&&(
                        <Button id={'navBtn'} variant="contained" color="primary" onClick={this.handleRoute} >
                            Calculate
                        </Button>

                    )}

                </div>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }
}
export default Navigation;
