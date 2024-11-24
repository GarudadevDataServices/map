
function load_data(link) {
    $.getJSON(link, function (json) {
        featuredata = json;
        trigger = json["trigger"];
        document.getElementById("info").innerHTML = json["desc"];
        //document.getElementById("title").innerHTML=json["title"];
        document.getElementById("title").innerHTML = "Loading...";
        //stateLayer.setStyle(style);
        load_map(rootdata["map"]);
    });
}

function load_data_again(link){
    $.getJSON(link, function (json) {
        featuredata = json;
        trigger = json["trigger"];
        tapped=false;
        stateLayer.setStyle(style);
        stateLayer.eachLayer(function (layer) {
            onEachFeature(layer.feature,layer);
            checkLayer=null;
        });
        document.getElementById("info").innerHTML = json["desc"];
        document.getElementById("title").innerHTML=json["title"];
    });
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

function load_data_after(time,link){
    sleep(time*1000).then(() => {
        load_data_again(link);
    });
}

function load_data_freq(time,link){
    console.log("calling data again");
    sleep(time*1000).then(() => {
        load_data_again(link);
        load_data_freq(time,link);
    });
}