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

}