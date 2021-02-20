import { DataGrid } from '@material-ui/data-grid';
import {Link} from "react-router-dom";
import {Button} from "@material-ui/core";
import React, { Component } from 'react';
import Geofence from "./Geofence";
import {Auth} from "aws-amplify";
import amplifyConfig from "./aws-exports";
const columns = [
    { field: 'geofenceID', headerName: 'GeofenceID', width: 170 },
    { field: 'createTime', headerName: 'Create Time', width: 170 },
    { field: 'geometry', headerName: 'Geometry', width: 170 },
    { field: 'status', headerName: 'Status', width: 170 },
];

const rows = [];
let geofenceService = new Geofence();
let geofenceArray = [];
let AWS = require("aws-sdk");
let credentials;
let locationService;


function fillTable(){
    for (let i =0;i<geofenceArray.length;i++){
        rows.push({ geofenceID: geofenceArray[i].geofenceID, createTime: geofenceArray[i].createTime,
            geometry: geofenceArray[i].coordinates, status: geofenceArray[i].status },)
    }
}

class ListGeofences extends Component{
    //Effects: getting current user credentials from AWS Cognito
    async getCurrentUser(){
        credentials = await Auth.currentCredentials();
        locationService = new AWS.Location({
            credentials,
            region: amplifyConfig.aws_project_region,
        });
    }

    async componentDidMount(){
        await this.getCurrentUser()
        await geofenceService.getGeofenceData(locationService,geofenceArray)
        console.log(geofenceArray)

        fillTable()


    }
    render(){
        return (
            <div style={{ height: 400, width: '100%' }}>
                <Link to="/">
                    <Button id={'backbtn'} variant={'outlined'}color={'secondary'}>
                        back
                    </Button>
                </Link>
                <DataGrid rows={rows} columns={columns} pageSize={5} checkboxSelection />
            </div>
        );

    }
}
export default ListGeofences;