import { DataGrid } from '@material-ui/data-grid';
import {Link} from "react-router-dom";
import {Button} from "@material-ui/core";
import React, { Component } from 'react';
import Geofence from "../Geofence/Geofence";
import {Auth} from "aws-amplify";
import amplifyConfig from "../aws-exports";
import AWS from 'aws-sdk';
import Location from "aws-sdk/clients/location";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import GeofenceHelper from "../Helpers/GeofenceHelper";


let geofenceService = new GeofenceHelper();
let geofenceArray = [];
let credentials;
let locationService;

let geofenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION

function createData(id, createTime, status) {
    return {id, createTime, status};
}


class ListGeofences extends Component{
    constructor(props) {
        super(props);
        this.state={
            columns : [
                {field: 'geofenceID', headerName: 'Geofence ID', width: 250},
                {field: 'createTime', headerName: 'Create Time', width: 500},
                // {field: 'geometry', headerName: 'Geometry', width: 200},
                {field: 'status', headerName: 'Status', width: 170},
            ],
            rows :[]
        }
        this.fillTable = this.fillTable.bind(this)

    }
    fillTable() {
        let rows=[]
        for (let i = 0; i < geofenceArray.length; i++) {
            rows.push(createData(geofenceArray[i].geofenceId,geofenceArray[i].createTime,geofenceArray[i].status))
        }
        this.setState({
            rows: rows
        })
    }

    //Effects: getting current user credentials from AWS Cognito
    async getCurrentUser(){
        credentials = await Auth.currentCredentials();
        locationService = new AWS.Location({
            credentials,
            region: amplifyConfig.aws_project_region,
        });
    }
    async componentWillMount() {
        await this.getCurrentUser()
        geofenceArray = await geofenceService.listGeofence()
        console.log(geofenceArray)
        this.fillTable()

    }

    deleteOnAWS(id){
        var params = {
            CollectionName: geofenceCollection, /* required */
            GeofenceIds: [id]
        };
        locationService.batchDeleteGeofence(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

    }

    handleDelete(i){
        const { rows } = this.state;
        this.deleteOnAWS(rows[i].id)
        rows.splice(i, 1);
        this.setState({ rows });
        console.log(this.state.rows)
    }


    render(){
        return (
            <div style={{ height: 700, width: '100%' }}>
                <Link to="/">
                    <Button id={'backbtn'} variant={'outlined'}color={'secondary'}>
                        Back to Map
                    </Button>

                </Link>

                <TableContainer component={Paper}>
                    <Table className={'table'} size="small" aria-label="a dense table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Geofence ID</TableCell>
                                <TableCell>Create Time</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.rows.map((row, item) => (
                                <TableRow key={`row-${item}`}>
                                    <TableCell component="th" scope="row">
                                        {row.id}
                                    </TableCell>
                                    <TableCell>{JSON.stringify(row.createTime)}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                    <td> <Button id={'deletebtn'} variant={'outlined'}color={'secondary'}
                                            onClick={this.handleDelete.bind(this, item)}>
                                        Delete
                                    </Button></td>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );

    }
}
export default ListGeofences;