class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config,
    _data,
    _maps,
    _defaultFilters = [175, 176],
    _colorBys = [{ "time-elapsed": "Time elapsed" }, { "neighborhood": "Neighborhood" }, { "priority": "Priority" }, { "agency": "Responding agency" }, {"service-type": "Service type"}],
  ) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.maps = _maps;
    this.defaultFilters = _defaultFilters;
    this.activeFilters = new Set(this.defaultFilters);
    this.colorBys = _colorBys;
    this.colorBy = Object.keys(this.colorBys[0])[0];
    this.initVis();
  }

  setColorScale() {
    switch (this.colorBy) {
      case "time-elapsed":
        this.colorScale = d3.scaleSequential()
          .domain(d3.extent(this.data, (d) => this.getColorValue(d)))
          .interpolator(d3.interpolateYlOrRd)
        break;

      case "neighborhood":
        this.colorScale = d3.scaleOrdinal()
          .domain([...new Set(this.data.map((d) => this.getColorValue(d)))].sort())
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
          .domain([...new Set(this.data.map((d) => this.getColorValue(d)))].sort())
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
        break;

      case "service-type":
        this.colorScale = d3.scaleOrdinal()
          .domain([...new Set(this.data.map((d) => this.getColorValue(d)))].sort())
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

      default:
        break;
    }

  }

  getColorValue(d) {
    const vis = this;

    switch (vis.colorBy) {
      case "time-elapsed":
        const days = (new Date(d.DATE_LAST_UPDATE) - new Date(d.DATE_CREATED)) / (1000 * 60 * 60 * 24);
        // NOTE: Some of the data has a DATE_CREATED after the DATE_LAST_UPDATED. I don't know how or why, but this defaults to 0 when that happens
        return (days >= 0) ? days : 0;

      case "neighborhood":
        return vis.maps.NEIGHBORHOOD[d.NEIGHBORHOOD];

      case "priority":
        return vis.maps.PRIORITY[d.PRIORITY];

      case "agency":
        return vis.maps.DEPT_NAME[d.DEPT_NAME];

      case "service-type":
        return vis.maps.SR_TYPE_DESC[d.SR_TYPE_DESC >= 0 ? d.SR_TYPE_DESC : d];

      default:
        break;
    }
  }

  renderLegend() {
    const vis = this;

    if (vis.legendControl) {
      vis.legendControl.remove();
    }

    vis.legendControl = L.control({ position: "bottomleft" });

    vis.legendControl.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");

      const colorBySelect = L.DomUtil.create("select", "title", div);
      colorBySelect.name = colorBySelect.id = "color-by";
      vis.colorBys.forEach((choice) => {
        const [value, label] = Object.entries(choice)[0];
        const option = L.DomUtil.create("option", "", colorBySelect);
        option.value = value;
        option.textContent = label.replace("-", " ").toUpperCase();
        if (value === vis.colorBy) option.selected = true;
      });

      vis.legendBoxes = L.DomUtil.create("div", "boxes", div);
      vis.legendTooltip = L.DomUtil.create("div", "legend-tooltip", div);

      colorBySelect.addEventListener("change", (e) => {
        vis.colorBy = e.target.value;
        vis.setColorScale();
        vis.updateLegend();
        vis.updateFilters();
      });

      return div;
    }

    vis.legendControl.addTo(vis.theMap);
    vis.updateLegend();
  }

  updateLegend() {
    const vis = this;

    const domain = vis.colorScale.domain();
    const range = vis.colorScale.range();

    vis.legendBoxes.innerHTML = "";
    document.querySelector(".legend .labels")?.remove();

    switch (vis.colorBy) {
      case "time-elapsed":
        const bar = L.DomUtil.create("div", "bar", vis.legendBoxes);
        bar.style.backgroundImage = `linear-gradient(to right, ${range[0]}, ${range[1]})`;
        const labels = L.DomUtil.create("div", "labels", document.querySelector(".legend"));
        const min = document.createElement("p");
        min.textContent = `${Math.round(domain[0])} days`;
        min.classList.add("label");
        const max = document.createElement("p");
        max.textContent = `${Math.round(domain[1])} days`;
        labels.append(min, max);
        max.classList.add("label");
        break;

      default:
        domain.forEach((d, i) => {
          if (vis.colorBy === "service-type" && !vis.activeFilters.has(i)) return;

          const box = L.DomUtil.create("div", "box", vis.legendBoxes);
          box.style = `background-color: ${vis.colorScale(d)}`;

          box.addEventListener("mouseover", () => {
            vis.legendTooltip.textContent = d;
            vis.legendTooltip.style.display = "block";
          });

          box.addEventListener("mousemove", (e) => {
            const { width } = vis.legendTooltip.getBoundingClientRect();
            vis.legendTooltip.style.left = (e.pageX - (width / 2) >= 0) ? `${e.pageX}px` : `${e.pageX + (width / 4)}px`;
          });

          box.addEventListener("mouseout", () => {
            vis.legendTooltip.style.display = "none";
          });
        });
        break;
    }
  }

  renderFilter() {
    const vis = this;

    if (vis.filterControl) {
      vis.filterControl.remove();
    }

    vis.filterControl = L.control({ position: "topright" });

    vis.filterControl.onAdd = function () {
      const div = L.DomUtil.create("div", "filters");

      const button = L.DomUtil.create("button", "control-button", div);
      button.title = "Filters"
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/></svg>`

      const pane = L.DomUtil.create("dialog", "pane", div);
      L.DomEvent.disableScrollPropagation(pane);
      L.DomEvent.disableClickPropagation(pane);

      const title = L.DomUtil.create("h4", "title", pane);
      title.textContent = "FILTERS";

      const filters = L.DomUtil.create("fieldset", "filters-list", pane);

      vis.maps["SR_TYPE_DESC"].forEach((serviceType, i) => {
        const group = L.DomUtil.create("div", "filter-group", filters);
        const input = L.DomUtil.create("input", "filter-checkbox", group);
        input.type = "checkbox";
        input.name = `filter-${i}`;
        input.id = `filter-${i}`;
        if (vis.activeFilters.has(i)) input.checked = true;

        input.addEventListener("change", (e) => {
          if (e.target.checked) {
            vis.activeFilters.add(i);
          } else {
            vis.activeFilters.delete(i);
          }
          vis.updateFilters();
        });

        const label = L.DomUtil.create("label", "filter-label", group);
        label.htmlFor = `filter-${i}`;
        label.textContent = serviceType;
      });

      button.addEventListener("click", () => {
        if (pane.open) {
          pane.close();
        } else {
          pane.show();
        }
      });

      return div;
    }

    vis.filterControl.addTo(vis.theMap);

  }

  updateFilters() {
    const vis = this;

    vis.filteredData = vis.data.filter((d) => vis.activeFilters.has(Number(d["SR_TYPE_DESC"])));

    vis.setColorScale();

    //these are the city locations, displayed as a set of dots 
    vis.Dots = vis.svg.selectAll('circle')
      .data(vis.filteredData)
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
                                  Location: ${d.ADDRESS} <br> 
                                  Priority: ${vis.maps.PRIORITY[d.PRIORITY]} <br>
                                  Handler: ${vis.maps.DEPT_NAME[d.DEPT_NAME]} <br>
                                  Call Type: ${vis.maps.SR_TYPE[d.SR_TYPE]} <br>
                                  Description: ${vis.maps.SR_TYPE_DESC[d.SR_TYPE_DESC]} <br>
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

      if (vis.colorBy === "service-type") vis.renderLegend();
  }

  renderLayersControl() {
    const vis = this;

    if (vis.layersControl) {
      vis.layersControl.remove();
    }

    vis.layersControl = L.control({ position: "topright" });

    vis.layersControl.onAdd = function () {
      const div = L.DomUtil.create("div", "layers");

      const button = L.DomUtil.create("button", "control-button", div);
      button.title = "Layers"
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-118 120-398l66-50 294 228 294-228 66 50-360 280Zm0-202L120-600l360-280 360 280-360 280Zm0-280Zm0 178 230-178-230-178-230 178 230 178Z"/></svg>`

      const pane = L.DomUtil.create("dialog", "pane", div);
      L.DomEvent.disableScrollPropagation(pane);
      L.DomEvent.disableClickPropagation(pane);

      const title = L.DomUtil.create("h4", "title", pane);
      title.textContent = "LAYERS";

      const filters = L.DomUtil.create("fieldset", "layers-list", pane);

      vis.layers.forEach((layer, i) => {
        const group = L.DomUtil.create("div", "layer-group", filters);
        const input = L.DomUtil.create("input", "layer-radio", group);
        const [value, labelValue] = Object.entries(layer)[0];
        input.type = "radio";
        input.name = `layer`;
        input.id = `layer-${i}`;
        if (vis.activeLayer === value) input.checked = true;

        input.addEventListener("change", (e) => {
          if (e.target.checked) {
            vis.activeLayer = value;
          }
          vis.updateVis();
        });

        const label = L.DomUtil.create("label", "layer-label", group);
        label.htmlFor = `layer-${i}`;
        label.textContent = labelValue;
      });

      button.addEventListener("click", () => {
        if (pane.open) {
          pane.close();
        } else {
          pane.show();
        }
      });

      return div;
    }

    vis.layersControl.addTo(vis.theMap);
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

    vis.layers = [{ "light": "Light" }, { "stamen": "Regular" }, { "topo": "Topographic" }];
    vis.activeLayer = "light";

    vis.base_layer = L.tileLayer(vis.stAlUrl, {
      id: 'stamen-image',
      attribution: vis.stAlAttr,
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
    vis.renderLegend();
    vis.renderFilter();
    vis.renderLayersControl();

    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function () {
      vis.updateVis();
    });

    vis.updateFilters();
  }

  updateVis() {
    let vis = this;

    vis.theMap.removeLayer(vis.base_layer);

    console.log(vis.activeLayer);

    if (vis.activeLayer === "topo") {
      vis.base_layer = L.tileLayer(vis.topoUrl, {
        id: 'topo-image',
        attribution: vis.esriAttr,
        ext: 'png'
      });
    } else if (vis.activeLayer === "light") {
      vis.base_layer = L.tileLayer(vis.stAlUrl, {
        id: 'alidade-image',
        attribution: vis.stAlAttr,
        ext: 'png'
      });
    } else if (vis.activeLayer === "stamen") {
      vis.base_layer = L.tileLayer(vis.stUrl, {
        id: 'stamen-image',
        attribution: vis.stUrl,
        ext: 'png'
      });
    } else {
      vis.base_layer = L.tileLayer(vis.stUrl, {
        id: 'stamen-image',
        attribution: vis.stAttr,
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