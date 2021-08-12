import './App.css';
import MapPage from "./Pages/MapPage";
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {BrowserRouter as Router, Switch, Route, Redirect, HashRouter} from 'react-router-dom';
import ListGeofencesPage from './Pages/ListGeofencesPage'
import React from "react";
import HomePage from './Pages/HomePage'
import Navbar from './Components/Navbar'
import GeofenceCreationPage from './Pages/GeofenceCreationPage'
import GeofencePage from './Pages/GeofencePage'
import Navigation from "./Pages/Navigation";
import {Container} from "@material-ui/core";
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider} from "@material-ui/pickers";

function App() {
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>

        <div className="App">
            <HashRouter>
                <Navbar/>
                <Container className={'xl'}>
                    <Redirect to="/home" />
                    <Switch>
                        <Route path ='/home' exact component={HomePage}/>
                        <Route path ='/geofence' exact component={GeofencePage}/>
                        <Route path ='/list-geofence' exact component={ListGeofencesPage}/>
                        <Route path ='/navigation' exact component={Navigation}/>


                    </Switch>

                </Container>
            </HashRouter>
        </div>
        </MuiPickersUtilsProvider>
    );
}

export default withAuthenticator(App);
