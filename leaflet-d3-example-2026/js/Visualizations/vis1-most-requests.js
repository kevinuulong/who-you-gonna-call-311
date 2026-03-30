d3.csv('data/311Sample.csv').then(data => {

    const counts = d3.rollups(
        data,
        v => v.length,
        d => d.NEIGHBORHOOD ? d.NEIGHBORHOOD.trim() : "Unknown"
    ).map(d => ({
        neighborhood: d[0],
        count: d[1]
    }));

    counts.sort((a, b) => b.count - a.count);

    const topData = counts.slice(0, 15);

    const margin = { top: 20, right: 20, bottom: 80, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#vis1-most-requests")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(topData.map(d => d.neighborhood))
        .range([0, width])
        .padding(0.2);
    const y = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.count)])
        .nice()
        .range([height, 0]);

    svg.selectAll("rect")
        .data(topData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.neighborhood))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end");
    svg.append("g")
        .call(d3.axisLeft(y));


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("text-anchor", "middle")
        .text("Neighborhood");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Number of Requests");

    console.log("Neighborhood counts:", topData);
});