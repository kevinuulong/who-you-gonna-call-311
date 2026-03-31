let leafletMap;
let filteredData;

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

    // Initialize timeline
    timeline = new Timeline({ 
      parentElement: '#timeline',
      containerWidth: 800,
      containerHeight: 300
    }, data, maps);

    // Initialize map
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data, maps);

  })
  .catch(error => console.error(error));

  function updateFilteredData() {
    timeline.updateVis();
  }

function showVis(id) {
    const visIds = [
        "vis1-most-requests",
        "vis2-common-methods",
        "vis3-department-requests",
        "vis4-priority"
    ];

    visIds.forEach(v => {
        d3.select("#" + v).style("display", v === id ? "block" : "none");
    });
}

window.onload = function () {
    showVis("vis1-most-requests");
};