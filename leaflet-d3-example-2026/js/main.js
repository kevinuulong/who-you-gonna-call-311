let leafletMap;

// TODO: Look into using Marker clusters for some things (especially the neighborhoods)
// https://github.com/Leaflet/Leaflet.markercluster

Promise.all([
  d3.csv("data/311Compressed2025.csv"),
  d3.json("data/maps.json"),
])
  .then(data => ({ data: data[0], maps: data[1] }))
  .then(({ data, maps }) => {
    const NUMBER_COLUMNS = ["LATITUDE", "LONGITUDE"];
    
    console.log("number of items: " + data.length);

    data.forEach(d => {  //convert from string to number
      NUMBER_COLUMNS.forEach((column) => d[column] = Number(d[column]));
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#my-map" }, data, maps);

  })
  .catch(error => console.error(error));

function changeMap() {
  if (leafletMap) {
    leafletMap.updateVis();
  } else {
    console.log("Map not ready yet!");
  }
}
