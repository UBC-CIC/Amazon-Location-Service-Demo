import './ListGeofencePage.css'
import {Button, Container} from "@material-ui/core";
import React, {Component} from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import * as AWS from "aws-sdk";
import amplifyConfig from "../aws-exports";
import {Auth} from "aws-amplify";



let credentials;
let locationService;
const geofenceCollection = process.env.REACT_APP_GEOFENCE_COLLECTION;

function createData(id, createTime, status) {
    return {id, createTime, status};
}


class ListGeofencesPage extends Component{
    constructor(props) {
        super(props);
        this.state={
            columns : [
                {field: 'geofenceID', headerName: 'Geofence ID', width: 250},
                {field: 'createTime', headerName: 'Create Time', width: 500},
                {field: 'status', headerName: 'Status', width: 170},
            ],
            geofenceArray : [],
            rows :[]
        }
        this.fillTable = this.fillTable.bind(this)
        this.backToMap = this.backToMap.bind(this)

    }
    //fill the table with the geofence fetched from aws
    fillTable() {
        const {geofenceArray} = this.state
        var rows = []
        for (let i = 0; i < geofenceArray.length; i++) {
            rows.push(createData(geofenceArray[i].geofenceId,geofenceArray[i].createTime.toString(),geofenceArray[i].status))
        }
        this.setState({
            rows:rows
        })
    }
    //Using auth to get currentCredentials
    async getCurrentUser(){
        credentials = await Auth.currentCredentials();
        locationService = new AWS.Location({
            credentials,
            region: amplifyConfig.aws_project_region,
        });
    }
    listGeofence(){
        let geofenceArray = []
        locationService.listGeofences({CollectionName: geofenceCollection}, (err, response) => {
            if (err) console.log(err);
            if (response && response.Entries.length>0) {
                for (let i = 0; i < response.Entries.length; i++) {
                    geofenceArray.push({
                        geofenceId:response.Entries[i].GeofenceId,
                        coordinates:response.Entries[i].Geometry.Polygon,
                        createTime:response.Entries[i].CreateTime,
                        status:response.Entries[i].Status
                    })
                }
            }
            this.setState({
                geofenceArray:geofenceArray
            })
            this.fillTable()
        });

    }
    async componentDidMount(){
        await this.getCurrentUser()
        await this.listGeofence()

    }


    //delete geofence on aws
    deleteGeofence(id){
        let params = {
            CollectionName: geofenceCollection, /* required */
            GeofenceIds: [id]
        };
        locationService.batchDeleteGeofence(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

    }
    //Delete geofence from the table and aws
    handleDelete(i){
        const { rows } = this.state;
        this.deleteGeofence(rows[i].id)
        rows.splice(i, 1);
        this.setState({ rows });
    }

    //go back to map view
    backToMap(){
        this.props.history.push('/geofence')
    }

    // make an api request to get the list of geofences under geoFenceCollection
//For each geofence found, store the geofenceID, coordinates, creatTime and status as an instance of Geofence class
// into geofenceArray
    async getGeofenceData() {
        const{geofenceArray} = this.state
        let credentials = await Auth.currentCredentials();
        let locationService = new AWS.Location({
            credentials,
            region: amplifyConfig.aws_project_region,
        });
        locationService.listGeofences({CollectionName: geofenceCollection}, (err, response) => {
            if (err) console.log(err);
            if (response && response.Entries.length>0) {
                for (let i = 0; i < response.Entries.length; i++) {
                    geofenceArray.push({
                        geofenceId:response.Entries[i].GeofenceId,
                        coordinates:response.Entries[i].Geometry.Polygon,
                        createTime:response.Entries[i].CreateTime,
                        status:response.Entries[i].Status,

                    })
                }
            }
        });
    }


    render(){
        return (
            <Container>
                <Button id={'backbtn'} variant="contained" color="primary" style={{textTransform: 'none'}} onClick={this.backToMap}>
                        Go Back
                </Button>
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
                                    <td> <Button id={'deletebtn'} variant="contained" color="primary" style={{textTransform: 'none'}}
                                            onClick={this.handleDelete.bind(this, item)}>
                                        Delete
                                    </Button></td>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        );

    }
}
export default ListGeofencesPage;

