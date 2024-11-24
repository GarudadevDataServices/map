
function style(feature) {
    var color;
    try{
        color=featuredata["data"][feature["properties"][trigger]]["color"];}
    catch{
        console.log("Failed for "+[feature["properties"][trigger]]);
        color="snow";
    }
    
    if ("border" in featuredata){
        var border= featuredata["border"].split(",");
        return {
            fillColor: color,
            weight: border[0],
            opacity: border[1],
            color: 'black',
            fillOpacity: .7
        };
    }
    return {
        fillColor: color,
        weight: 0.5,
        opacity: 0.5,
        color: 'black',
        fillOpacity: .7
    };
}