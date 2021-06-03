import './App.css';
import MapPage from "./Pages/MapPage";
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {BrowserRouter as Router, Switch, Route, Redirect} from 'react-router-dom';
import ListGeofencesPage from './Pages/ListGeofencesPage'
import React from "react";
import HomePage from './Pages/HomePage'
import Navbar from './Components/Navbar'
import GeofenceCreationPage from './Pages/GeofenceCreationPage'
import GeofencePage from './Pages/GeofencePage'
function App() {
    return (
        <div className="App">
            <Router>
                <Navbar/>
                <Redirect to="/home" />
                <Switch>
                    <Route path ='/home' exact component={HomePage}/>
                    <Route path ='/geofence' exact component={GeofencePage}/>
                    <Route path ='/geofence-creation' exact component={GeofenceCreationPage}/>


                </Switch>
            </Router>
        </div>
    );
}

export default withAuthenticator(App);
