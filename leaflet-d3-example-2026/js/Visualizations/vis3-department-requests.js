Promise.all([
  d3.csv("data/311Compressed2025.csv"),
  d3.json("data/maps.json"),
])
.then(data => ({ data: data[0], maps: data[1] }))
.then(({ data, maps }) => {
    const counts = d3.rollups(
        data,
        v => v.length,
        d => maps.DEPT_NAME[d.DEPT_NAME]
            ? maps.DEPT_NAME[d.DEPT_NAME].trim()
            : "Unknown"
    ).map(d => ({ dept: d[0], count: d[1] }));

    const filtered = counts.filter(d => d.dept !== "Unknown");
    filtered.sort((a, b) => b.count - a.count);
    const topData = filtered;

    const margin = { top: 50, right: 10, bottom: 50, left: 150 };
    const width = 400 - margin.left - margin.right;
    const height = 750 - margin.top - margin.bottom;

    const svg = d3.select("#vis3-department-requests")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
        .attr("x", (width / 2) - 50)
        .attr("y", -margin.top + 25)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Requests by Department");

    const x = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.count / 1000)])
        .nice()
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(topData.map(d => d.dept))
        .range([0, height])
        .padding(0.2);

    const agencies = topData.map(d => d.dept).sort();
    const colorScale = d3.scaleOrdinal()
        .domain(agencies)
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
        ]);

    const tooltip = d3.select("#tooltip");

    svg.selectAll("rect")
        .data(topData)
        .enter()
        .append("rect")
        .attr("y", d => y(d.dept))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.count / 1000))
        .attr("fill", d => colorScale(d.dept))
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<div><strong>${d.dept}</strong><br>
                       Requests: ${d.count.toLocaleString()}<br>
                       Per 1000: ${(d.count / 1000).toFixed(1)}</div>`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 10}px`)
                   .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

    yAxis.selectAll(".tick text")
    .each(function(d) {
        const text = d3.select(this);
        if (text.text().length > 15) {
            const words = text.text().split(" ");
            text.text("");
            text.append("tspan")
                .attr("x", "-1em")
                .attr("dy", 0)
                .text(words.slice(0, Math.ceil(words.length/2)).join(" "));
            text.append("tspan")
                .attr("x", "-1em")
                .attr("dy", "1em")
                .text(words.slice(Math.ceil(words.length/2)).join(" "));
        }
        text.style("font-size", "12px");
    });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Number of Requests (per 1000)")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", -margin.left)
        .attr("y", -5)
        .text("Department")
        .style("font-weight", "bold");
});