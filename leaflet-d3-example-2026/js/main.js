let leafletMap;

const colorBySelect = document.getElementById("color-by");
let colorBy = colorBySelect.value;

d3.csv('data/311Sample.csv')  //**** TO DO  switch this to loading the quakes 'data/2024-2025.csv'
.then(data => {
    console.log("number of items: " + data.length);

    data.forEach(d => {  //convert from string to number
      d.LATITUDE = +d.LATITUDE; 
      d.LONGITUDE = +d.LONGITUDE;  
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);


  })
  .catch(error => console.error(error));

colorBySelect.addEventListener("change", (e) => {
  colorBy = e.target.value;
  leafletMap.updateVis();
});