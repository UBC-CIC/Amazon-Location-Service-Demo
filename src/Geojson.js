import {polygonArea} from 'd3-polygon';
export default class Geojson{
    //Effects: return the coordinates data into a readable format for mapboxgl
     geojsonFormatter(coordinates) {
         var geojsonData = {
                 'type': 'Feature',
                 'geometry': {
                     'type': 'Polygon',
                     'coordinates': []
                 }
         }
         geojsonData.geometry.coordinates.push(coordinates)
         return geojsonData
     }

     determinePolygonOrientation(coordinates){
         //calculate area of the drawn polygon on the map
         let area = polygonArea(coordinates)
         //if area is positive, polygon is drawn in clockwise direction
         //else area is negative or 0, polygon is drawn in counter-clockwise
         if(area>0){
             console.log("ClockWise")
             //return the reversed array of coordinates
             //since reversing clockwise coordinates will make them counter-clockwise
             return coordinates.slice().reverse();
         }else{
             console.log("Counter-Clockwise")
             return coordinates
         }
     }
}