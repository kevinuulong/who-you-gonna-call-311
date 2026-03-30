class Timeline {
  constructor(_config, _data, _maps) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 300,
    };
    this.data = _data;
    this.maps = _maps;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.margin = { top: 20, right: 30, bottom: 40, left: 60 };
    vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
    vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.config.parentElement)
      .append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.g = vis.svg.append('g')
      .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`);

    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);
    vis.colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    vis.xAxisGroup = vis.g.append('g')
      .attr('transform', `translate(0,${vis.height})`);

    vis.yAxisGroup = vis.g.append('g');

    vis.tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '6px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    const data = typeof filteredData !== 'undefined' ? filteredData : vis.data;

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthIndex = {};
    monthNames.forEach((m,i)=>monthIndex[m]=i);

    // Map SR_TYPE -> SR_TYPE_DESC
    const typeMap = {};
    data.forEach(d => {
      if (!typeMap[d.SR_TYPE]) typeMap[d.SR_TYPE] = d.SR_TYPE_DESC;
    });

    // Use SR_TYPE_DESC in the categories
    const categories = Array.from(new Set(data.map(d => typeMap[d.SR_TYPE])));

    vis.colorScale.domain(categories);

    // Group data by month and SR_TYPE_DESC
    const grouped = d3.rollups(
      data,
      v => v.length,
      d => {
        let raw = d.DATE_CLOSED;
        if (!raw) return null;

        let match = raw.match(/^(\d{4})\s+(\w{3})/);
        if (match) return match[2];

        let fallback = raw.match(/^(\d{1,2})\//);
        if (fallback) return monthNames[fallback[1]-1];

        return null;
      },
      d => typeMap[d.SR_TYPE] // use human-readable
    );

    // Build stacked input with zero-fill
    const stackedInput = grouped.map(([month, values]) => {
      let obj = { month };
      categories.forEach(cat => obj[cat] = 0);
      values.forEach(([cat, count]) => obj[cat] = count);
      return obj;
    }).sort((a,b)=>monthIndex[a.month]-monthIndex[b.month]);

    vis.xScale.domain(stackedInput.map(d => d.month));

    const stack = d3.stack().keys(categories);
    const series = stack(stackedInput);

    const maxVal = d3.max(series, s => d3.max(s, d => d[1])) || 0;
    vis.yScale.domain([0, maxVal]).nice();

    // Draw stacked bars
    const layers = vis.g.selectAll('.layer')
      .data(series, d => d.key)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', d => vis.colorScale(d.key));

    layers.selectAll('rect')
      .data(d => d.map(v => ({ ...v, key: d.key })))
      .join(
        enter => enter.append('rect')
          .attr('x', d => vis.xScale(d.data.month))
          .attr('width', vis.xScale.bandwidth())
          .attr('y', vis.height)
          .attr('height', 0)
          .on('mousemove', (event, d) => {
            const value = d[1] - d[0];

            // Compute total for the month
            const nonZeroCategories = Object.entries(d.data)
              .filter(([k, v]) => k !== 'month' && v > 0);
            const total = nonZeroCategories.reduce((acc, [, v]) => acc + v, 0);

            const showTotal = nonZeroCategories.length > 1;

            vis.tooltip
              .style('opacity', 1)
              .html(`
                <strong>Report ID:</strong> ${vis.maps.SR_TYPE_DESC[d.key]}<br>
                <strong>Month:</strong> ${d.data.month}<br>
                <strong>Count:</strong> ${value}
                ${showTotal ? `<br><strong>Total:</strong> ${total}` : ''}
              `)
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 20 + 'px');
          })
          .on('mouseleave', () => vis.tooltip.style('opacity', 0))
          .call(enter => enter.transition()
            .duration(500)
            .attr('y', d => vis.yScale(d[1]))
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
          ),

        update => update.call(update => update.transition()
          .duration(500)
          .attr('x', d => vis.xScale(d.data.month))
          .attr('width', vis.xScale.bandwidth())
          .attr('y', d => vis.yScale(d[1]))
          .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        ),

        exit => exit.remove()
      );

    vis.xAxisGroup.call(d3.axisBottom(vis.xScale));
    vis.yAxisGroup.call(d3.axisLeft(vis.yScale));
  }
}