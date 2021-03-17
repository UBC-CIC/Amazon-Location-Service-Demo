import './App.css';
import MapPage from "./Pages/MapPage";
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {BrowserRouter as Router, Switch,Route} from 'react-router-dom';
import ListGeofencesPage from './Pages/ListGeofencesPage'
import React from "react";

function App() {
    return (
        <div className="App">
            <AmplifySignOut/>
            <Router>
                <Switch>
                    <Route path='/geofence' exact component={ListGeofencesPage} />
                    <Route path ='/' exact component={MapPage}/>
                </Switch>
            </Router>
        </div>
    );
}

export default withAuthenticator(App);
