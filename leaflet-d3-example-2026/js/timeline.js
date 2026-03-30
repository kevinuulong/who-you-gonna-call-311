class Timeline {
  /**
   * Class constructor with basic configuration
   * @param {Object} _config - Configuration object
   * @param {Array} _data - Array of data items
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 300,
    };
    this.data = _data;
    this.initVis();
  }

  /**
   * Initialize scales, axes, and append static elements
   */
  initVis() {
    let vis = this;

    // Set dimensions
    vis.margin = { top: 20, right: 30, bottom: 30, left: 60 };
    vis.width =
      vis.config.containerWidth -
      vis.margin.left -
      vis.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.margin.top -
      vis.margin.bottom;

    // Create SVG
    vis.svg = d3
      .select(vis.config.parentElement)
      .append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.g = vis.svg
      .append('g')
      .attr('transform', `translate(${vis.margin.left},${vis.margin.top})`);

    // Initialize scales
    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.1);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append x-axis
    vis.xAxisGroup = vis.g
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis
    vis.yAxisGroup = vis.g.append('g').attr('class', 'axis y-axis');

    // Add y-axis label
    vis.g
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - vis.margin.left)
      .attr('x', 0 - vis.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Issues');

    // Add x-axis label
    vis.g
      .append('text')
      .attr('transform', `translate(${vis.width / 2}, ${vis.height + vis.margin.bottom})`)
      .style('text-anchor', 'middle')
      .text('Month');

    vis.updateVis();
  }

  /**
   * Wrangle data and update visualization
   */
  updateVis() {
    let vis = this;

    // Month mapping for proper ordering
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndices = {};
    monthNames.forEach((month, index) => {
      monthIndices[month] = index;
    });

    // Parse dates and group by month only (no year since all data is 2025)
    const monthCounts = {};

    vis.data.forEach(d => {
      // Prefer DATE_CLOSED if available, otherwise fall back to DATE_TIME_RECEIVED
      let rawDate = d.DATE_CLOSED;
      if (!rawDate || rawDate.trim().length === 0) {
        return; // skip missing closed date rows
      }

      try {
        // 1) Try format like "2025 Dec 24 12:00:00 AM"
        let closeMatch = rawDate.match(/^(\d{4})\s+(\w{3})/);
        if (closeMatch) {
          const month = closeMatch[2];
          if (monthNames.includes(month)) {
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            return;
          }
        }

        // 2) Try format like "1/2/25" fallback
        let lenMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (lenMatch) {
          const monthNum = parseInt(lenMatch[1], 10);
          if (monthNum >= 1 && monthNum <= 12) {
            const month = monthNames[monthNum - 1];
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            return;
          }
        }

        console.warn('Could not parse DATE_CLOSED/DATE_TIME_RECEIVED:', rawDate);
      } catch (e) {
        console.warn('Could not parse date:', rawDate, e);
      }
    });

    // Convert to array and sort by month order
    vis.processedData = Object.entries(monthCounts)
      .map(([month, count]) => ({
        month: month,
        count: count,
        monthIndex: monthIndices[month]
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex);

    console.log('Month counts:', monthCounts);
    console.log('Processed data:', vis.processedData);

    // Update scales
    vis.xScale.domain(vis.processedData.map(d => d.month));
    vis.yScale.domain([0, d3.max(vis.processedData, d => d.count)]).nice();

    // Bind data to bars
    const bars = vis.g
      .selectAll('.bar')
      .data(vis.processedData, d => d.month);

    // Enter + Update
    bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => vis.xScale(d.month))
      .attr('y', d => vis.yScale(d.count))
      .attr('width', vis.xScale.bandwidth())
      .attr('height', d => vis.height - vis.yScale(d.count))
      .attr('fill', 'steelblue');

    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }

  /**
   * Render the visualization
   */
  renderVis() {
    // Optional: add animations or additional rendering logic
  }
}
