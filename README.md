#  Amazon Location Services Template - React.js

For future CIC projects that requires maps, we can use this repository as a template.
This template uses Amazon Location Services to:
1. Create a map source
2. Geocoding/Reverse geocoding
3. Display geofence

### Pre-reqs
Location service is only available in the regions below (As of Feb 10, 2021).
<img src="./docs/images/region.png"  width="400"/>

Make sure your sso profile is using one those regions.


## How to use
1. Install dependencies using `npm install`
2. Log into aws and initiate this project as an Amplify project: `amplify init`
3. Add authentication to this project:
   ```
   amplify add auth
   ? Do you want to use the default authentication and security configuration? Default configuration
   ? How do you want users to be able to sign in? Username
   ? Do you want to configure advanced settings?  No, I am done.
   ```
   
4. To create map resource, follow the instructions [here](https://docs.aws.amazon.com/location/latest/developerguide/create-map-resource.html)
   - Take a note of the map name
5. To create a place index resource, follow the instructions [here](https://docs.aws.amazon.com/location/latest/developerguide/create-place-index-resource.html)
    - Take a note of the place index name
6. To create a geofence collection, follow the instructions [here](https://docs.aws.amazon.com/location/latest/developerguide/add-geofences.html)
   - You can use the example geojson file in this [github page](https://github.com/UBC-CIC/Amazon-Location-Template/tree/main/geofence%20examples) and upload this file onto the geofence collection you just created
   - Take a note of the geofence collection name

7. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/home)
   1. Choose Manage Identity Pools
    2. Choose the identity pool that is being used for this amplify project
    3. Click edit identity pool in the top right corner
    4. Take a note the name of the Authenticated IAM role attached to this Identity Pool
    
8. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
    1. Click roles on the left panel
    2. Click onto the role name noted from step 7.5
    3. Now, we need to add 3 differenct inline policies to this role
    4. Remember to change REGION, ACCOUNTID, MAPNAME, PLACEINDEXNAME and GEOFENCECOLLECTIONNAME to the ones associated with your account
    
   ```
    {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MapsReadOnly",
            "Effect": "Allow",
            "Action": [
                "geo:GetMapStyleDescriptor",
                "geo:GetMapGlyphs",
                "geo:GetMapSprites",
                "geo:GetMapTile"
            ],
            "Resource": "arn:aws:geo:REGION:ACCOUNTID:map/MAPNAME"
             }
        ]
   }
   ```
    5. Place index access policy
    ```
   {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PlacesReadOnly",
            "Effect": "Allow",
            "Action": [
                "geo:SearchPlaceIndex*"
            ],
            "Resource": "arn:aws:geo:REGION:ACCOUNTID:place-index/PLACEINDEXNAME"
            }
        ]
    }
   ```
      6. Geofence collection access policy
      
      ```
         {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "GetGeofences",
               "Effect": "Allow",
               "Action": [
                   "geo:ListGeofences",
                   "geo:GetGeofence"
               ],
               "Resource": "arn:aws:geo:REGION:ACCOUNTID:geofence-collection/GEOFENCECOLLECTIONNAME"
            }
         ]
      }
      ```

9. Create a local env file for map name and place index name
    1. Under the root directory, create a file named .env
    2. Copy the code below and replace MAPNAME, PLACEINDEXNAME, GEOFENCECOLLECTIONNAME with the names you created (from step 4,5 and 6):
    ```
   REACT_APP_MAP_NAME=MAPNAME
   REACT_APP_PLACE_INDEX_NAME=PLACEINDEXNAME
   REACT_APP_GEOFENCE_COLLECTION=GEOFENCECOLLECTIONNAME
   ```
   
10. `npm start` to run the application you should see a screen like this:
    Create an account and log in to view the map
    
    <img src="./docs/images/login.png"  width="800"/>
    <img src="./docs/images/map.png"  width="800"/>



