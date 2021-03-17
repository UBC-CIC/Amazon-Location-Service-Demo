export default class GeojsonHelper{
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

    //calculate area of the drawn polygon on the map, return a set of coordinates
    // in counter-clockwise order
    determinePolygonOrientation(coordinates){
        let polygonArea = require('area-polygon')
        let area = polygonArea(coordinates,true)
        //if area is negative, polygon is drawn in clockwise orientation
        //else area is positive, polygon is drawn in counter-clockwise orientation
        if(area<0){
            //return the reversed array of coordinates
            //since reversing clockwise coordinates will make them counter-clockwise
            return coordinates.slice().reverse();
        }else{
            return coordinates
        }
    }
}