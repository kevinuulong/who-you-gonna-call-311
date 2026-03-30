d3.csv('data/311Sample.csv').then(data => {

    data.forEach(d => {
        d.type = d.SR_TYPE_DESC ? d.SR_TYPE_DESC.trim() : "Unknown";
        d.priority = d.PRIORITY ? d.PRIORITY.trim() : "Unknown";
    });

    const priorities = Array.from(new Set(data.map(d => d.priority)));

    const nested = d3.rollups(
        data,
        v => {
            const counts = {};
            priorities.forEach(p => counts[p] = 0);
            v.forEach(d => counts[d.priority]++);
            return counts;
        },
        d => d.type
    );

    let stackedData = nested.map(d => {
        return { type: d[0], ...d[1] };
    });

    stackedData.sort((a, b) => {
        const sumA = priorities.reduce((s, p) => s + a[p], 0);
        const sumB = priorities.reduce((s, p) => s + b[p], 0);
        return sumB - sumA;
    });

    stackedData = stackedData.slice(0, 8);

    const margin = { top: 20, right: 20, bottom: 100, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#vis4-priority")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(stackedData.map(d => d.type))
        .range([0, width])
        .padding(0.2);
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d =>
            priorities.reduce((sum, p) => sum + d[p], 0)
        )])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(priorities)
        .range(d3.schemeSet2);

    const stack = d3.stack()
        .keys(priorities);

    const series = stack(stackedData);

    svg.selectAll("g.layer")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.type))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

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
        .attr("y", height + 80)
        .attr("text-anchor", "middle")
        .text("Service Request Type");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Number of Requests");

    console.log("Stacked data:", stackedData);

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, 0)`);
        priorities.forEach((p, i) => {
            const row = legend.append("g")
                .attr("transform", `translate(0, ${i * 15})`);
            row.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", color(p));
            row.append("text")
                .attr("x", 15)
                .attr("y", 9)
                .text(p)
                .style("font-size", "10px");
        });
});