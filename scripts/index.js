// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.

var markers = []
var latlngs = []
var map = null;
var heatmap = null;
var searchBox = null; 
var selectedMarker = null;
var oldIcon = null;
var json_global = "unchanged";
currentmark = null;
function setGlobal(newstring)
{
    json_global = newstring;
}
function sendMessage(message)
{
    document.getElementById("message").innerHTML = message;
    document.getElementById("search").value = "";
    document.getElementById("search").focus();
}

function toggleMarkers() {
    for(marker of markers) {
        if(marker.map == null) {
            marker.setMap(map);
        } else {
            marker.setMap(null);
        }
    }
}

function orderByDate(geo_list)
{
    geo_list.sort(function(x, y) {
        datea = dateparse(x[2]);
        dateb = dateparse(y[2]);
        if(datea < dateb){
            return -1;
        }
        if(dateb < datea){
            return 1;
        }
        return 0;
    });
}
function changeHeatMap()
{
    if(heatmap.map == null)
    {
        heatmap.setMap(map);
    }
    else
    {
        heatmap.setMap(null);
    }
}
function dateparse(datestr)
{
    return Date.parse(datestr);
}
function parseData(json_data)
{
    var json = JSON.parse(json_data);
    var cords = [];
    console.log(typeof json.statuses);
    orderByDate(json.statuses);
    for( obj of json.statuses)
    {
        //json_obj = JSON.parse(obj);
        try {
            var tmpArray = obj['geo']['coordinates'];
            tmpArray.push(obj['created_at']);
            cords.push(obj['geo']['coordinates']);
        } catch(Err) {
            continue;
        }
    }
    return cords;
}
function inputSearch() 
{
    var hashtag = document.getElementById("search").value;
    if(hashtag.indexOf("#") > -1){
        hashtag = hashtag.substring(1);
    }
    if(hashtag == "")
    {
        sendMessage("Please Enter A Search");
        return;
    }
    var image = {
        //url: place.icon,
        url: 'images/marker_turqoise.png',
        size: new google.maps.Size(75, 100),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 38)
    }; 
    var coords = [[38.825, -77.611], [39.8282, -98.5795], [41.3483, -113.9050]];
    var geo_list = [];
    for(coord of coords) {
        var lat = coord[0];
        var lon = coord[1];
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET","scripts/search.php?search="+hashtag+"&"+"lat="+lat+"&"+"lon="+lon, false);
        var json_result = "hello";
        xmlhttp.onload = function (){json_global = this.responseText; setGlobal(this.responseText);};
        xmlhttp.send();
        var newBounds = new google.maps.LatLngBounds();
        var tmp_list = parseData(json_global); 
        for(obj of tmp_list) {
            geo_list.push(obj);
        }
        //console.log(geo_list.length);
    }
    if(geo_list.length == 0) {
        sendMessage("No results found");
        return;
    }
    orderByDate(geo_list);
    var newBounds = new google.maps.LatLngBounds();
    for(var i = 0, mark; mark = markers[i]; i++) {
        mark.setMap(null);
    }
    markers = [];
    latlngs = [];
    for (obj of geo_list)
    {
        //console.log(obj);
        //console.log("Long: "+obj[0]+", Lat: " + obj[1]);
        var temp_latlng = new google.maps.LatLng(parseFloat(obj[0]),parseFloat(obj[1]));
        var temp_marker = new google.maps.Marker({
            icon: image,
            position: temp_latlng,
            draggable: false,
            animation: google.maps.Animation.DROP
        });
        newBounds.extend(temp_latlng);
        markers.push(temp_marker);
        latlngs.push(temp_latlng);
    }
    if(heatmap != null){
        heatmap.setMap(null);
    }
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: latlngs,
        radius: 35,
        opacity: .5,
    });
    markerIndex = 0;
    var timer = window.setInterval(function(){
        if(markerIndex >= markers.length) {
            sendMessage("Loaded all " + geo_list.length + " results!");
            window.clearTimeout(timer);
            return;
        }
        sendMessage("Found " + markerIndex + " results! (Loading chronologically)");
        markers[markerIndex].setMap(map);
        markerIndex++;
    }, 100);
    map.fitBounds(expandBounds(newBounds));
    console.log("Done adding marker"); 
}

function expandBounds(bounds) {
    var lat1 = bounds.getNorthEast().lat();
    var lon1 = bounds.getNorthEast().lng();
    var lat0 = bounds.getSouthWest().lat();
    var lon0 = bounds.getSouthWest().lng();
    var width = screen.availWidth;
    var remW = width - 300;
    var latDifAdj = (lat1-lat0)*width/remW;
    var lonDifAdj = (lon1-lon0)*width/remW;
    var nLat = lat1-latDifAdj;
    var nLon = lon1-lonDifAdj;
    var adjBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(nLat, nLon),
        bounds.getNorthEast());
    return adjBounds;
}

function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true, zoomControl: true
    });

    var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(38.825, -77.611),
        new google.maps.LatLng(39.000, -77.150));
    map.fitBounds(expandBounds(defaultBounds)); 

    var style = [
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "saturation": "-20"
                },
                {
                    "lightness": "5"
                },
                {
                    "color": "#61a8bf"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
                {
                    "lightness": "100"
                },
                {
                    "color": "#b1bbcc"
                },
                {
                    "saturation": "0"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                {
                    "saturation": "-30"
                },
                {
                    "lightness": "-50"
                },
                {
                    "color": "#305e80"
                }
            ]
        }
    ]
    map.setOptions({styles: style});    
    
    var search = document.getElementById('searchPanel');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

    //google.maps.event.addListener(searchBox, 'places_changed', function() {
    //    searchBox.setBounds(map.getBounds());
    //    var places = removeRepeats(searchBox.getPlaces());
    //    addLocations(places);
    //}); 
    
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
    });  
}

google.maps.event.addDomListener(window, 'load', initialize);