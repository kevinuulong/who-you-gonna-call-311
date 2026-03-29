let leafletMap;

const colorBySelect = document.getElementById("color-by");
let colorBy = colorBySelect.value;

// TODO: Look into using Marker clusters for some things (especially the neighborhoods)
// https://github.com/Leaflet/Leaflet.markercluster

d3.csv('data/311Sample.csv')
  .then(data => {
    console.log("number of items: " + data.length);

    data.forEach(d => {  //convert from string to number
      d.LATITUDE = +d.LATITUDE;
      d.LONGITUDE = +d.LONGITUDE;
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map' }, data);

  })
  .catch(error => console.error(error));

function changeMap() {
  if (leafletMap) {
    leafletMap.updateVis();
  } else {
    console.log("Map not ready yet!");
  }
}

colorBySelect.addEventListener("change", (e) => {
  colorBy = e.target.value;
  leafletMap.setColorScale();
  leafletMap.updateVis();
});
