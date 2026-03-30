const colorBySelect = document.getElementById("color-by");

d3.csv('data/311Sample.csv')  //**** TO DO  switch this to loading the quakes 'data/2024-2025.csv'
.then(data => {
    console.log("number of items: " + data.length);

    data.forEach(d => {  //convert from string to number
      d.LATITUDE = +d.LATITUDE; 
      d.LONGITUDE = +d.LONGITUDE;  
    });

    // Initialize map
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    // Initialize timeline
    timeline = new Timeline({ 
      parentElement: '#timeline',
      containerWidth: 800,
      containerHeight: 300
    }, data);

  })
  .catch(error => console.error(error));

colorBySelect.addEventListener("change", (e) => {
  console.log(e.target.value);
});