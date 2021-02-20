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

     sortCounterClockwise(coordinates){
         let reversed = coordinates.slice().reverse();
         var area = polygonArea(coordinates)
         console.log(area)
         if(area>0){
             console.log("ClockWise")
             return reversed
         }else{
             console.log("Counter-Clockwise")
             return coordinates
         }
     }
}