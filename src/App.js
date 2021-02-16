import './App.css';
import AmznMap from "./AmznMap";
import { withAuthenticator } from '@aws-amplify/ui-react';


//TODO write documentations on Geofence
function App() {
    return (
        <div className="App">
            <AmznMap/>
        </div>
    );
}

export default withAuthenticator(App);
