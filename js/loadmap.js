
//37.07365877077966,97.39493992506763,6.766415822012496,68.09381543863502
function load_map(file){
    // Layers
    var mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZGF0dGEwNyIsImEiOiJja3A2dHRrajEyN3JwMnZtd2ZtZTZnYzB4In0.i89VhIgx3UVvpTffewpr4Q';
    var layers = {'Google-Maps': L.tileLayer(mbUrl, { id: 'mapbox/outdoors-v11', tileSize: 512, zoomOffset: -1 }),'Satellite': L.tileLayer(mbUrl, { id: 'mapbox/satellite-v9', tileSize: 512, zoomOffset: -1 }), 'Satellite-Label': L.tileLayer(mbUrl, { id: 'mapbox/satellite-streets-v11', tileSize: 512, zoomOffset: -1 }), 'Streets': L.tileLayer(mbUrl, { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1 }),'Navigation-day': L.tileLayer(mbUrl, { id: 'mapbox/navigation-day-v1', tileSize: 512, zoomOffset: -1 }), 'Navigation-night': L.tileLayer(mbUrl, { id: 'mapbox/navigation-night-v1', tileSize: 512, zoomOffset: -1 }),'Light': L.tileLayer(mbUrl, { id: 'mapbox/light-v10', tileSize: 512, zoomOffset: -1 }), 'Dark': L.tileLayer(mbUrl, { id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1 }),'OpenStreetMap':L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),"None":L.tileLayer("")};
    // load map with the provided file and add control layers
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([51.505, -0.09], 13);
    $.getJSON(file, function (data) {
        stateLayer = L.geoJson(data, {style: style, onEachFeature: onEachFeature});
        // add control layers
        L.control.layers(layers).addTo(map);
        // add a select box for the layer
        var select = document.getElementById("loc");
        stateLayer.eachLayer(function (layer) {
            var option = document.createElement("option");
            option.value = layer.feature.properties[search_trigger];
            option.text = layer.feature.properties[search_trigger];
            select.appendChild(option);
        });
        // add an event listener to the select box
        select.addEventListener("change", function(e){
            var selected = e.target.value;
            stateLayer.eachLayer(function (layer) {
                if (layer.feature.properties[search_trigger] == selected){
                    console.log("selected " + selected);
                    layer.fire('click');
                    // update the map view with the bounds of the selected layer
                    map.fitBounds(layer.getBounds());
                }
            });
        });
        // add the stateLayer to the map
        stateLayer.addTo(map);
        // set the map view with the bounds of the stateLayer
        if ("bound" in featuredata){
            mapBounds =L.latLngBounds(featuredata["bound"]);
        }else{
            mapBounds=stateLayer.getBounds();
        }
        map.fitBounds(mapBounds );
        // update the title of the map
        if (featuredata['title']!=null){
            document.getElementById("title").innerHTML=featuredata['title'];
        }
        // execute the function if it is present
        if ("function" in featuredata){
            createFunction(featuredata["function"]);
        }else{console.log("no function is present");}
    });
    
}   


function createFunction(data){
    console.log("creating function");
    if (data["name"]=="load_data_freq"){
        var args=data["args"].split(",");
        load_data_freq(args[0],args[1]);
    }
}