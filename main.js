import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON'; 
import Map from 'ol/Map'; 
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';  
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Modify from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import {Fill, Stroke, Style} from 'ol/style';
import {getArea} from 'ol/sphere';
import colormap from 'colormap';

const map = new Map({ 
    target: 'map-container', 
    view: new View({ 
        center: [0, 0], 
        zoom: 2 
    }) 
}); 

const source = new VectorSource();

//VectorLayer with default styling
// const layer = new VectorLayer({
//     source: source
// });

//Example of static layer styling(renders features with a red fill and white outline)
// const layer = new VectorLayer({
//     source: source,
//     style: new Style({
//         fill: new Fill({
//             color: 'red'
//         }),
//         stroke: new Stroke({
//             color: 'white'
//         })
//     })
// });

//Example of dynamic layer styling(renders features using one of two styles depending on whether the "name" attribute starts with "A-M" or "N-Z")
// const layer = new VectorLayer({
//     source: source,
//     style: function(feature, resolution) {
//         const name = feature.get('name'.toUpperCase);
//         return name < "N" ? style1 : style2; //assuming these are created elsewhere
//     }
// });

//Example of a VectorLayer that is styled based on the area of a feature
//Functions to determine a color based on the area of a geometry
const min = 1e8; //the smallest area
const max = 2e13; //the biggest area
const steps = 50;
const ramp = colormap({
    colormap: 'blackbody',
    nshades: steps
});

function clamp(value, low, high) {
    return Math.max(low, Math.min(value, high));
}

function getColor(feature) {
    const area = getArea(feature.getGeometry());
    const f = Math.pow(clamp((area - min) / (max -min), 0, 1), 1 / 2);
    const index = Math.round(f * (steps -1));
    return ramp[index];
}

//VectorLayer that utilizes the style provided by our area function above
const layer = new VectorLayer({
    source: source,
    style: function(feature) {
        return new Style({
            fill: new Fill({
                color: getColor(feature)
            }),
            stroke: new Stroke({
                color: 'rgba(255,255,255,0.8'
            })
        });
    }
});

map.addLayer(layer);

//Allows you to drag and drop a .json file into the map application
map.addInteraction(new DragAndDrop({
    source: source,
    formatConstructors: [GeoJSON]
}));

//Allows you to modify existing features on the map
map.addInteraction(new Modify({
    source: source
}));

//Allows you to add polygon features to the map
map.addInteraction(new Draw({
    type:'Polygon',
    source: source
}));

//Used to help preserve topology while drawing and editing features
map.addInteraction(new Snap({
    source: source
}));

//Clears changes made to the map
const clear = document.getElementById('clear');
clear.addEventListener('click', function() {
    source.clear();
});

//Serializes feature data for download
const format = new GeoJSON({featureProjection: 'EPSG:3857'});
const download = document.getElementById('download');
source.on('change', function() {
    const features = source.getFeatures();
    const json = format.writeFeatures(features);
    download.href = 'data:text/json;charset=utf-8' + json;
});

