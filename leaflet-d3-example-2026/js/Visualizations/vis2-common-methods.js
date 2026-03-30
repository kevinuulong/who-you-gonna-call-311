Promise.all([
  d3.csv("data/311Compressed2025.csv"),
  d3.json("data/maps.json"),
])
  .then(data => ({ data: data[0], maps: data[1] }))
  .then(({ data, maps }) => {

    const counts = d3.rollups(
        data,
        v => v.length,
        d => maps.METHOD_RECEIVED[d.METHOD_RECEIVED]
    );

    const pieData = counts.map(d => ({
        method: d[0],
        count: d[1]
    }));

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select("#vis2-common-methods")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3.pie()
        .value(d => d.count);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    svg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.method))
        .attr("stroke", "white")
        .style("stroke-width", "1px");

    svg.selectAll("text")
        .data(pie(pieData))
        .enter()
        .append("text")
        .text(d => d.data.method)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "10px");
});