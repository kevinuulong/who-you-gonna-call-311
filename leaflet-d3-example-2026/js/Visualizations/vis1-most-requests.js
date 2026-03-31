Promise.all([
  d3.csv("data/311Compressed2025.csv"),
  d3.json("data/maps.json"),
])
.then(data => ({ data: data[0], maps: data[1] }))
.then(({ data, maps }) => {

    const counts = d3.rollups(
        data,
        v => v.length,
        d => maps.NEIGHBORHOOD[d.NEIGHBORHOOD]
            ? maps.NEIGHBORHOOD[d.NEIGHBORHOOD].trim()
            : "Unknown"
    ).map(d => ({
        neighborhood: d[0],
        count: d[1]
    }));

    const filtered = counts.filter(d => d.neighborhood !== "Unknown");
    filtered.sort((a, b) => b.count - a.count);
    const topData = filtered;

    const margin = { top: 50, right: 10, bottom: 60, left: 130 };
    const width = 400 - margin.left - margin.right;
    const height = 750 - margin.top - margin.bottom;

    const svg = d3.select("#vis1-most-requests")
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
        .text("Requests by Neighborhood");

    const x = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.count / 1000)])
        .nice()
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(topData.map(d => {
            if (d.neighborhood === "NORTH AVONDALE - PADDOCK HILLS") return "PADDOCK HILLS"; // too long, shortening it
            return d.neighborhood;
        }))
        .range([0, height])
        .padding(0.2);
    const yAxis = d3.axisLeft(y);

    const neighborhoods = topData.map(d => d.neighborhood).sort();
    const color = d3.scaleOrdinal()
        .domain(neighborhoods)
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
        ]);

    const tooltip = d3.select("#tooltip");

    svg.selectAll("rect")
        .data(topData)
        .enter()
        .append("rect")
        .attr("y", d => {
            if (d.neighborhood === "NORTH AVONDALE - PADDOCK HILLS") return y("PADDOCK HILLS");
            return y(d.neighborhood);
        })
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.count / 1000))
        .attr("fill", d => color(d.neighborhood))
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<div><strong>${d.neighborhood}</strong><br>
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

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Number of Requests (per 1000)")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", -margin.left)
        .attr("y", -5)
        .text("Neighborhood")
        .style("font-weight", "bold");
});