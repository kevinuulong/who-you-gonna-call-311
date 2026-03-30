Promise.all([
  d3.csv("data/311Compressed2025.csv"),
  d3.json("data/maps.json"),
])
  .then(data => ({ data: data[0], maps: data[1] }))
  .then(({ data, maps }) => {
    const counts = d3.rollups(
        data,
        v => v.length,
        d => maps.DEPT_NAME[d.DEPT_NAME] ? maps.DEPT_NAME[d.DEPT_NAME].trim() : "Unknown"
    ).map(d => ({ dept: d[0], count: d[1] }));

    counts.sort((a, b) => b.count - a.count);

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal(d3.schemeSet3)
        .domain(counts.map(d => d.dept));

    const svg = d3.select("#vis3-department-requests")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    svg.selectAll("path")
        .data(pie(counts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.dept))
        .attr("stroke", "white")
        .style("stroke-width", "1px");

    const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.9);

    svg.selectAll("text")
        .data(pie(counts))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text(d => d.data.dept)
        .style("font-size", "8px");

    console.log("Department request counts:", counts);
});