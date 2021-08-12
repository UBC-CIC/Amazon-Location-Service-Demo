import React, { Component,Fragment } from 'react';
import Amplify, {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
import Location from "aws-sdk/clients/location";
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
import TextField from "@material-ui/core/TextField";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {MuiPickersUtilsProvider} from "@material-ui/pickers";
import { DateTimePicker } from "@material-ui/pickers";

import {
    Accordion, AccordionDetails,
    AccordionSummary,
    Button,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select
} from "@material-ui/core";
import './MapPage.css'
import GeojsonHelper from "../Helpers/GeojsonHelper";
import MapboxDraw from "@mapbox/mapbox-gl-draw/index";
import GeofenceHelper from "../Helpers/GeofenceHelper";
import LocationServiceHelper from '../Helpers/LocationServiceHelper'
import Geofence from "../Geofence/Geofence";
import {Marker} from "mapbox-gl";
import Typography from "@material-ui/core/Typography";
let map;
let credentials;
let locationService;
let draw;
const AWS = require("aws-sdk");
const placeIndex = process.env.REACT_APP_PLACE_INDEX_NAME;
const locationHelper = new LocationServiceHelper()
Amplify.configure(amplifyConfig);

let departurePtMarker = new Marker();
let destinationPtMarker=new Marker();


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
            destinationCoords:null,
            travelMode:"Car",
            date:new Date(),
            departNow:true,
            avoidFerries:false,
            avoidTolls:false,
            height: null,
            length: null,
            dimensionUnit: null,
            width: null,
            weightUnit:null,
            weight:null
        };
    }

    async componentDidMount() {
        //get current user credentials
        await getLocationService();
        //make map
        await constructMap(this.container)

    }

    handleStateChange=(e)=>{
        console.log(e)
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
                    let marker
                    if(name==="departureCoords") marker=departurePtMarker
                    if(name==="destinationCoords") marker=destinationPtMarker
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
    handleCheckBoxChange=(e)=>{
        this.setState({[e.target.name]:!this.state[e.target.name]})
    }
    handleSelectChange=(e)=>{
        this.setState({[e.target.name]:e.target.value})

    }
    handleNumbersStateChange=(e)=>{
        const re = /^[0-9\b]+$/;
        if (e.target.value === '' || re.test(e.target.value)) {
            console.log(e.target.value)

            this.setState({
                [e.target.id]: e.target.value
            });
        }
    }

    calculateRoute=()=> {
        map.fitBounds([this.state.departureCoords,this.state.destinationCoords],
            {padding: {top: 100, bottom:100, left: 100, right: 100}})

        var params = {
            CalculatorName: process.env.REACT_APP_ROUTE_CALCULATOR, /* required */
            DeparturePosition: [this.state.departureCoords[0], this.state.departureCoords[1]],
            DestinationPosition: [this.state.destinationCoords[0], this.state.destinationCoords[1]],
            DepartNow: this.state.departNow,
            //     DistanceUnit: Kilometers | Miles,
                IncludeLegGeometry: true,
                TravelMode: this.state.travelMode,
            //     WaypointPositions: [
            //         [
            //             'NUMBER_VALUE',
            //             /* more items */
            //         ],
            //         /* more items */
            //     ]
        };
        if(!this.state.departNow){
            params["DepartureTime"]= new Date(this.state.date)
        }
        if(this.state.travelMode==="Car"){
            params["CarModeOptions"]={
                AvoidFerries: this.state.avoidFerries,
                AvoidTolls: this.state.avoidTolls
            }
        }
        if(this.state.travelMode==="Truck"){
            params['TruckModeOptions']={
                AvoidFerries: this.state.avoidFerries,
                AvoidTolls: this.state.avoidTolls,
                Dimensions: {
                    Height: this.state.height,
                    Length: this.state.length,
                    Unit: this.state.dimensionUnit,
                    Width: this.state.width
                },
                Weight: {
                    Total: this.state.weight,
                    Unit: this.state.weightUnit
                }
            }          //     TruckModeOptions: {
            //     },

        }
        console.log(params)
        locationService.calculateRoute(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                var coordinates = []
                console.log(data);           // successful response
                data.Legs[0].Geometry.LineString.map((item) => {
                    coordinates.push(item)
                })
                console.log(coordinates)
                if(map.getLayer("route")) map.removeLayer("route")
                if(map.getSource("route")) map.removeSource("route")

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
                            'line-color': '#009dff',
                            'line-width': 8,
                            'line-opacity': 0.5
                        }
                    });

                }})
    }
    handleDateChange=(e)=>{
        this.state.date=e
    }

    render(){
        const disableSearch = !(this.state.departurePoint&&this.state.endingPoint)
        const{height,weight,length,width,dimensionUnit,weightUnit} = this.state
        const checkTruck = this.state.travelMode==="Truck"&&height!==null&&weight!==null&&length!==null&&
            width!==null&&dimensionUnit!==null&&weightUnit!==null
        const otherTravelModes= this.state.travelMode==="Walking"||this.state.travelMode==="Car"
        const disabled= !((this.state.travelMode==="Truck")?checkTruck:otherTravelModes)

        return (
            <div className={"xl"} id = {'mapPage'} >
                <Container className={"xl"} id={"sbContainer"}>
                    <TextField id="departurePoint" label="Enter starting point" type="outlined" value={this.state.departurePoint} onChange={e=>this.handleStateChange(e)}/>
                    <TextField id="endingPoint" label="Enter destination" type="outlined" value={this.state.endingPoint} onChange={e=>this.handleStateChange(e)}/>
                    <FormControl>
                        <InputLabel id={"travelMode"} >Travel Mode</InputLabel>
                        <Select
                            name={"travelMode"}
                            value={this.state.travelMode}
                            onChange={this.handleSelectChange}
                        >
                            <MenuItem name={"travelMode"} value={"Car"}>Car</MenuItem>
                            <MenuItem name={"travelMode"} value={"Truck"}>Truck</MenuItem>
                            <MenuItem name={"travelMode"} value={"Walking"}>Walking</MenuItem>
                        </Select>
                    </FormControl>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <Typography>Advanced Options</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormControlLabel
                                control={<Checkbox
                                    name={"departNow"}
                                    checked={this.state.departNow}
                                    onChange={this.handleCheckBoxChange}
                                />
                                }
                                label="Depart now"
                                labelPlacement="end"
                            />
                            {this.state.departNow===false&&(
                                <DateTimePicker
                                    label="DateTimePicker"
                                    id={"date"}
                                    value={this.state.date}
                                    inputVariant="outlined"
                                    onChange={this.handleDateChange}
                                    disablePast={true}
                                />

                            )}

                            {(this.state.travelMode==="Truck"||this.state.travelMode==="Car")&&(
                                <Container>
                                <FormControlLabel
                                control={<Checkbox
                                name={"avoidFerries"}
                                checked={this.state.avoidFerries}
                                onChange={this.handleCheckBoxChange}
                                />
                            }
                                label="Avoid Ferries"
                                labelPlacement="end"
                                />
                                <FormControlLabel
                                control={<Checkbox
                                name={"avoidTolls"}
                                checked={this.state.avoidTolls}
                                onChange={this.handleCheckBoxChange}
                                />
                            }
                                label="Avoid Tolls"
                                labelPlacement="end"
                                />
                                </Container>
                                )}


                                {this.state.travelMode==="Truck"&&(
                                    <Container>

                                        <Typography>
                                            Truck dimensions
                                        </Typography>
                                        <TextField id="length" label="Enter length" type="outlined" value={this.state.length} onChange={e=>this.handleNumbersStateChange(e)}/>
                                        <TextField id="width" label="Enter width" type="outlined" value={this.state.width} onChange={e=>this.handleNumbersStateChange(e)}/>
                                        <TextField id="height" label="Enter height" type="outlined" value={this.state.height} onChange={e=>this.handleNumbersStateChange(e)}/>
                                        <FormControl>
                                            <InputLabel id={"dimensionUnit"} >Unit</InputLabel>
                                            <Select
                                                name={"dimensionUnit"}
                                                value={this.state.dimensionUnit}
                                                onChange={this.handleSelectChange}
                                            >
                                                <MenuItem name={"dimensionUnit"} value={"Meters"}>Meters</MenuItem>
                                                <MenuItem name={"dimensionUnit"} value={"Feet"}>Feet</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField id="weight" label="Enter weight" type="outlined" value={this.state.weight} onChange={e=>this.handleNumbersStateChange(e)}/>
                                        <FormControl>
                                            <InputLabel id={"weightUnit"} >Weight Unit</InputLabel>
                                            <Select
                                                name={"weightUnit"}
                                                value={this.state.weightUnit}
                                                onChange={this.handleSelectChange}
                                            >
                                                <MenuItem name={"weightUnit"} value={"Kilograms"}>Meters</MenuItem>
                                                <MenuItem name={"weightUnit"} value={"Pounds"}>Feet</MenuItem>
                                            </Select>
                                        </FormControl>

                                    </Container>


                                )}




                        </AccordionDetails>
                    </Accordion>


                    <Button id={'navBtn'} variant="contained" color="primary" onClick={this.handleSearch} disabled={disableSearch} >
                        Search
                    </Button>
                    {(this.state.destinationCoords&&this.state.departureCoords)&&(
                        <Button id={'navBtn'} variant="contained" color="primary" onClick={this.handleRoute} disabled={disabled} >
                            Calculate
                        </Button>

                    )}

                </Container>
                <div className='Map' ref={(x) => { this.container = x }}/>
            </div>
        )
    }
}
export default Navigation;
