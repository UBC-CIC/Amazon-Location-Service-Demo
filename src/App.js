import './App.css';
import AmznMap from "./AmznMap";
import { withAuthenticator } from '@aws-amplify/ui-react';
import {BrowserRouter as Router, Switch,Route} from 'react-router-dom';
import ListGeofences from './ListGeofences'

//TODO write documentations on Geofence
function App() {
    return (
        <div className="App">
            <Router>
                <Switch>
                    <Route path='/geofence' exact component={ListGeofences} />
                    <Route path ='/' exact component={AmznMap}/>
                </Switch>
            </Router>
        </div>
    );
}

export default withAuthenticator(App);
