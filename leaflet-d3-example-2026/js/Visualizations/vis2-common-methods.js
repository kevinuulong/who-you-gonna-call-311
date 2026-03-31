Promise.all([
    d3.csv("data/311Compressed2025.csv"),
    d3.json("data/maps.json"),
])
.then(data => ({ data: data[0], maps: data[1] }))
.then(({ data, maps }) => {

    let counts = d3.rollups(
        data,
        v => v.length,
        d => maps.METHOD_RECEIVED[d.METHOD_RECEIVED]
    ).map(d => ({ method: d[0], count: d[1] }));

    const total = d3.sum(counts, d => d.count);

    let majorMethods = [];
    let otherCount = 0;
    let otherMethods = [];
    counts.forEach(d => {
        if (d.count / total < 0.01) {
            otherCount += d.count;
            if(d.method) otherMethods.push(d.method);
        } else {
            majorMethods.push(d);
        }
    });
    if (otherCount > 0) majorMethods.push({ method: "Other (<1%)", count: otherCount, includes: otherMethods });

    const width = 400;
    const height = 700;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select("#vis2-common-methods")
        .append("svg")
        .attr("width", width)
        .attr("height", height + 100);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .text("Most Common Request Methods")
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    const pieGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, 275)`);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(majorMethods.map(d => d.method));

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcs = pieGroup.selectAll("path")
        .data(pie(majorMethods))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.method))
        .attr("stroke", "white")
        .style("stroke-width", "1px");

    pieGroup.selectAll("text")
        .data(pie(majorMethods))
        .enter()
        .append("text")
        .filter(d => d.data.count / total >= 0.05)
        .text(d => d.data.method)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px");

    const legend = svg.append("g")
        .attr("transform", `translate(150, ${radius * 2 + 125})`);

    const legendItems = legend.selectAll("g")
        .data(majorMethods.filter(d => d.method))
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendItems.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => color(d.method));

    legendItems.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .style("font-size", "14px")
        .text(d => d.method);

    const tooltip = d3.select("#tooltip");

    function highlight(method) {
        arcs.style("opacity", d => d.data.method === method ? 1 : 0.3)
            .attr("stroke-width", d => d.data.method === method ? 3 : 1);
        legendItems.selectAll("rect")
            .style("opacity", d => d.method === method ? 1 : 0.3)
            .attr("stroke", d => d.method === method ? "#000" : "none")
            .attr("stroke-width", d => d.method === method ? 2 : 0);
        legendItems.selectAll("text")
            .style("opacity", d => d.method === method ? 1 : 0.3);
    }

    function resetHighlight() {
        arcs.style("opacity", 1).attr("stroke-width", 1);
        legendItems.selectAll("rect").style("opacity", 1).attr("stroke", "none").attr("stroke-width", 0);
        legendItems.selectAll("text").style("opacity", 1);
        tooltip.style("display", "none");
    }

    arcs.on("mouseover", (event, d) => {
        highlight(d.data.method);
        tooltip.style("display", "block")
            .html(`<div><strong>${d.data.method}</strong><br>
                   Count: ${d.data.count.toLocaleString()}<br>
                   Percentage: ${(d.data.count / total * 100).toFixed(2)}%</div>`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
    }).on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`)
               .style("top", `${event.pageY + 10}px`);
    }).on("mouseout", () => resetHighlight());

    legendItems.on("mouseover", (event, d) => {
        highlight(d.method);
        tooltip.style("display", "block")
            .html(`<div><strong>${d.method}</strong><br>
                   Count: ${d.count.toLocaleString()}<br>
                   Percentage: ${(d.count / total * 100).toFixed(2)}%</div>`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
    }).on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`)
               .style("top", `${event.pageY + 10}px`);
    }).on("mouseout", () => resetHighlight());

    console.log("Method counts (grouped):", majorMethods);
});