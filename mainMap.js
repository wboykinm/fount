mapboxgl.accessToken = 'pk.eyJ1IjoibGFuZHBsYW5uZXIiLCJhIjoiY2pmYmpmZmJrM3JjeTMzcGRvYnBjd3B6byJ9.qr2gSWrXpUhZ8vHv-cSK0w';
var url = "https://spreadsheets.google.com/feeds/list/1Qs0kZqTtlaMqgmqQphKmk7a0BELjQXeYb0CJVQZk7js/1/public/values?alt=json"
// General function
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

// handle navigation
function navMe(lon,lat) {
  // if no geo in browser, use btv center
  if (!navigator.geolocation){
    var navUrl = 'nav?start=' + '-73.21349' + ',' + '44.47657' + '&end=' + lon + ',' + lat
    window.open(navUrl)
  } else {
    // or use browser location
    navigator.geolocation.getCurrentPosition(function(position) {
      var navUrl = 'nav?start=' + position.coords.longitude + ',' + position.coords.latitude + '&end=' + lon + ',' + lat
      window.open(navUrl)
    },function error() {
      // again, if no geo in browser, use btv center
      var navUrl = 'nav?start=' + '-73.21349' + ',' + '44.47657' + '&end=' + lon + ',' + lat
      window.open(navUrl)
    });
  }
}

$.getJSON(url, function(data) {
  var stops = data.feed.entry;
  
  // build geojson from google sheet data:
  var fountGeojson = {type: 'FeatureCollection', features: []};

  for (var i in stops) {
    if (stops[i].gsx$latitude.$t) {
      var feature = {
        type: 'Feature',
        properties: {
          name: stops[i].gsx$name.$t,
          description: stops[i].gsx$name.$t
        },
        geometry: {
          type: 'Point',
          coordinates: [
            stops[i].gsx$longitude.$t, 
            stops[i].gsx$latitude.$t
          ]
        }
      };
      fountGeojson.features.push(feature);
    }
  }
  
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/landplanner/cirqis7ob0004g6mb94a54q65',
    center: [-73.21349,44.47657],
    zoom: 14,
    pitch: 55
  });

  // This adds the data to the map
   map.on('load', function(e) {
     map.addControl(new mapboxgl.NavigationControl());
     map.addSource("places", {
       "type": "geojson",
       "data": fountGeojson
     });
     
    // This is where your interactions with the symbol layer used to be
    // Now you have interactions with DOM markers instead
    fountGeojson.features.forEach(function(marker, i) {
      // Create an img element for the marker
      var el = document.createElement('div');
      el.id = "marker-" + i;
      el.style.left = '-18px';
      el.style.top = '-18px';
      el.className = 'marker'// ' + typeLookup[marker.properties.name];
      // Add markers to the map at all points
      new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates)
        .addTo(map);

      el.addEventListener('click', function(e) {
        // 1. Fly to the point
        flyToSite(marker);
        // 2. Close all other popups and display popup for clicked site
        createPopUp(marker);
        // the oddly-crucial bit:
        e.stopPropagation();
      });
    });

    // add wacky movement because you're still not over all the 
    // 3d stuff available w/ GL
    function flyToSite(currentFeature) {
      map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 16.5,
        bearing: Math.floor(Math.random() * 50) + 1,
        pitch: Math.floor(Math.random() * 40) + 21,
        speed: 0.3,
        curve: 1
      });
    }

    function createPopUp(currentFeature) {
      var popUps = document.getElementsByClassName('mapboxgl-popup');
      if (popUps[0]) popUps[0].remove();
      var popupContent = '<h4 class="text-info">' + currentFeature.properties.name + '</h4><a onclick="navMe(' + currentFeature.geometry.coordinates + ')" class="btn btn-primary">Navigate</a>'
      var popup = new mapboxgl.Popup({
          closeOnClick: true
        })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(popupContent)
        .addTo(map);
      console.log('there should totally be a popup visible because this is the end of the createPopup function bound to ' + currentFeature.properties.name + '!')
    }
  });
});