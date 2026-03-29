class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.initVis();
  }

  setColorScale() {
    switch (colorBy) {
      case "time-elapsed":
        this.colorScale = d3.scaleSequential()
          .domain(d3.extent(this.data, this.getColorValue))
          .interpolator(d3.interpolateYlOrRd)
        break;

      case "neighborhood":
        this.colorScale = d3.scaleOrdinal()
          .domain([...new Set(this.data.map(this.getColorValue))].sort())
          // TODO: This technically gets the job done, but is not very nice
          .range([
            '#3957ff', '#d3fe14', '#c9080a', '#fec7f8',
            '#0b7b3e', '#0bf0e9', '#c203c8', '#fd9b39',
            '#888593', '#906407', '#98ba7f', '#fe6794',
            '#10b0ff', '#ac7bff', '#fee7c0', '#964c63',
            '#1da49c', '#0ad811', '#bbd9fd', '#fe6cfe',
            '#297192', '#d1a09c', '#78579e', '#81ffad',
            '#739400', '#ca6949', '#d9bf01', '#646a58',
            '#d5097e', '#bb73a9', '#ccf6e9', '#9cb4b6',
            '#b6a7d4', '#9e8c62', '#6e83c8', '#01af64',
            '#a71afd', '#cfe589', '#d4ccd1', '#fd4109',
            '#bf8f0e', '#2f786e', '#4ed1a5', '#d8bb7d',
            '#a54509', '#6a9276', '#a4777a', '#fc12c9',
            '#606f15', '#3cc4d9', '#f31c4e', '#73616f'
          ])
        break;

      case "priority":
        this.colorScale = d3.scaleOrdinal()
          .domain(["STANDARD", "PRIORITY", "HAZARDOUS", "EMERGENCY"])
          .range(["#888593", "#10b0ff", "#ac7bff", "#c9080a"])
        break;

      case "agency":
        this.colorScale = d3.scaleOrdinal()
          .domain([...new Set(this.data.map(this.getColorValue))].sort())
          .range([
            '#3957ff', '#d3fe14',
            '#c9080a', '#fec7f8',
            '#0b7b3e', '#0bf0e9',
            '#c203c8', '#fd9b39',
            '#888593', '#906407',
            '#98ba7f', '#fe6794',
            '#10b0ff', '#ac7bff',
            '#fee7c0', '#964c63',
            '#1da49c'
          ])

      default:
        break;
    }

    this.renderLegend();
  }

  getColorValue(d) {
    switch (colorBy) {
      case "time-elapsed":
        return (new Date(d.DATE_LAST_UPDATE) - new Date(d.DATE_CREATED)) / (1000 * 60 * 60 * 24);

      case "neighborhood":
        return d.NEIGHBORHOOD;

      case "priority":
        return d.PRIORITY;

      case "agency":
        return d.DEPT_NAME;

      default:
        break;
    }
  }

  renderLegend() {
    const vis = this;

    if (vis.legendControl) {
      vis.legendControl.remove();
    }

    // 2. Create a new Leaflet control
    vis.legendControl = L.control({ position: "bottomleft" });

    vis.legendControl.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");
      const domain = vis.colorScale.domain();
      const range = vis.colorScale.range();

      const title = L.DomUtil.create("p", "title", div);
      title.textContent = colorBy.replace("-", " ").toUpperCase();

      const boxes = L.DomUtil.create("div", "boxes", div);
      const tooltip = L.DomUtil.create("div", "legend-tooltip", div);

      switch (colorBy) {
        case "time-elapsed":
          const bar = L.DomUtil.create("div", "bar", boxes);
          bar.style.backgroundImage = `linear-gradient(to right, ${range[0]}, ${range[1]})`;
          const labels = L.DomUtil.create("div", "labels", div);
          const min = document.createElement("p");
          min.textContent = `${Math.round(domain[0])} days`;
          min.classList.add("label");
          const max = document.createElement("p");
          max.textContent = `${Math.round(domain[1])} days`;
          labels.append(min, max);
          max.classList.add("label");
          break;

        default:
          domain.forEach(d => {
            const box = L.DomUtil.create("div", "box", boxes);
            box.style = `background-color: ${vis.colorScale(d)}`;

            box.addEventListener("mouseover", () => {
              tooltip.textContent = d;
              tooltip.style.display = "block";
            });

            box.addEventListener("mousemove", (e) => {
              tooltip.style.left = `${e.pageX}px`;
            });

            box.addEventListener("mouseout", () => {
              tooltip.style.display = "none";
            });
          });
          break;
      }

      return div;
    }


    vis.legendControl.addTo(vis.theMap);

  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    //ESRI
    vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    //TOPO
    vis.topoUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'

    //Thunderforest Outdoors- requires key... so meh... 
    vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
    vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //Stamen Terrain
    vis.stUrl = 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.{ext}';
    vis.stAttr = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    vis.stOutUrl = 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}';
    vis.stOutAttr = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    vis.stAlUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}';
    vis.stAlAttr = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //this is the base map layer, where we are showing the map background
    //**** TO DO - try different backgrounds 

    vis.base_layer = L.tileLayer(vis.stUrl, {
    id: 'stamen-image',
    attribution: vis.esriAttr,
    ext: 'png'
    });

    vis.theMap = L.map('my-map', {
      center: [39.103119, -84.512016],
      zoom: 11,
      layers: [vis.base_layer]
    });

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({ clickable: true }).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")

    vis.setColorScale();

    //these are the city locations, displayed as a set of dots 
    vis.Dots = vis.svg.selectAll('circle')
      .data(vis.data)
      .join('circle')
      .attr("fill", (d) => vis.colorScale(vis.getColorValue(d)))  //---- TO DO- color by magnitude 
      .attr("stroke", "black")
      //Leaflet has to take control of projecting points. 
      //Here we are feeding the latitude and longitude coordinates to
      //leaflet so that it can project them on the coordinates of the view. 
      //the returned conversion produces an x and y point. 
      //We have to select the the desired one using .x or .y
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).y)
      .attr("r", d => 3)  // --- TO DO- want to make radius proportional to earthquake size? 
      .on('mouseover', function (event, d) { //function to add mouseover event
        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration('150') //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", "red") //change the fill
          .attr('r', 4); //change radius

        //create a tool tip
        d3.select('#tooltip')
          .style('display', "block")
          .style('z-index', 1000000)
          // Format number with million and thousand separator
          //***** TO DO- change this tooltip to show useful information about the quakes
          .html(`<div class="tooltip-label">
                                  Date Recieved: ${d.DATE_TIME_RECEIVED} <br> 
                                  Last Update: ${d.DATE_LAST_UPDATE} <br>
                                  Location: ${d.LOCATION} <br> 
                                  Priority: ${d.PRIORITY} <br>
                                  Handler: ${d.DEPT_NAME} <br>
                                  Call Type: ${d.SR_TYPE} <br>
                                  Description: ${d.SR_TYPE_DESC} <br>
                                  </div>`);

      })
      .on('mousemove', (event) => {
        //position the tooltip
        d3.select('#tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseleave', function () { //function to add mouseover event
        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
          .duration('150') //how long we are transitioning between the two states (works like keyframes)
          .attr("fill", (d) => vis.colorScale(vis.getColorValue(d))) //change the fill  TO DO- change fill again
          .attr('r', 3) //change radius

        d3.select('#tooltip').style('display', "none");//turn off the tooltip

      })

    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function () {
      vis.updateVis();
    });

  }

  updateVis() {
    let vis = this;
    let mapType = document.getElementById("map-type").value;

    vis.theMap.removeLayer(vis.base_layer);

    if (mapType === "topo") {
      vis.base_layer = L.tileLayer(vis.topoUrl, {
      id: 'topo-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });
    } else if (mapType === "stamen") {
      vis.base_layer = L.tileLayer(vis.stUrl, {
      id: 'stamen-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });
    } else {
      vis.base_layer = L.tileLayer(vis.stUrl, {
      id: 'stamen-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });
    }

    vis.base_layer.addTo(vis.theMap);
    //want to see how zoomed in you are? 
    // console.log(vis.map.getZoom()); //how zoomed am I?
    //----- maybe you want to use the zoom level as a basis for changing the size of the points... ?

    //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).y)
      .attr("fill", (d) => vis.colorScale(vis.getColorValue(d)))  //---- TO DO- color by magnitude 
      .attr("r", 3);

  }


  renderVis() {
    let vis = this;

    //not using right now... 

  }
}