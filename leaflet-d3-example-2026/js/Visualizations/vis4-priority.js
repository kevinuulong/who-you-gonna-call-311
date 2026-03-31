Promise.all([
    d3.csv("data/311Compressed2025.csv"),
    d3.json("data/maps.json"),
])
    .then(data => ({ data: data[0], maps: data[1] }))
    .then(({ data, maps }) => {

        data.forEach(d => {
            d.priority = maps.PRIORITY[d.PRIORITY]
                ? maps.PRIORITY[d.PRIORITY].trim()
                : "Unknown";
        });

        let counts = d3.rollups(
            data,
            v => v.length,
            d => d.priority
        ).map(d => ({
            priority: d[0],
            count: d[1]
        }));

        counts = counts.filter(d => d.priority !== "Unknown");

        const total = d3.sum(counts, d => d.count);
        const width = 400;
        const height = 700;
        const radius = Math.min(width, height) / 2;

        const svgContainer = d3.select("#vis4-priority")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .style("font-family", "Arial, sans-serif");

        svgContainer.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .text("Request Priority Distribution")
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold");

        const svg = svgContainer.append("g")
            .attr("transform", `translate(${width / 2}, 275)`);

        const priorityColors = {
            "STANDARD": "#888593",
            "PRIORITY": "#10b0ff",
            "HAZARDOUS": "#ac7bff",
            "EMERGENCY": "#c9080a"
        };

        const color = d3.scaleOrdinal()
            .domain(counts.map(d => d.priority))
            .range(counts.map(d => priorityColors[d.priority]));

        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const arcs = svg.selectAll("path")
            .data(pie(counts))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.priority))
            .attr("stroke", "white")
            .style("stroke-width", "1px");

        const labelArc = d3.arc()
            .innerRadius(radius * 0.7)
            .outerRadius(radius * 0.9);

        svg.selectAll("text.slice-label")
            .data(pie(counts))
            .enter()
            .append("text")
            .attr("class", "slice-label")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .text(d => (d.data.count / total >= 0.05 ? d.data.priority : ""));

        const legend = svgContainer.append("g")
            .attr("transform", `translate(150, ${radius * 2 + 125})`);

        const legendItems = legend.selectAll("g")
            .data(counts)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(0, ${i * 30})`);

        legendItems.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => color(d.priority));

        legendItems.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .style("font-size", "12px")
            .text(d => d.priority);

        const tooltip = d3.select("#tooltip");

        function highlight(priority) {
            arcs.style("opacity", d => d.data.priority === priority ? 1 : 0.3)
                .attr("stroke-width", d => d.data.priority === priority ? 3 : 1);
            legendItems.selectAll("rect")
                .style("opacity", d => d.priority === priority ? 1 : 0.3)
                .attr("stroke", d => d.priority === priority ? "#000" : "none")
                .attr("stroke-width", d => d.priority === priority ? 2 : 0);
            legendItems.selectAll("text")
                .style("opacity", d => d.priority === priority ? 1 : 0.3);
        }

        function resetHighlight() {
            arcs.style("opacity", 1).attr("stroke-width", 1);
            legendItems.selectAll("rect").style("opacity", 1).attr("stroke", "none").attr("stroke-width", 0);
            legendItems.selectAll("text").style("opacity", 1);
            tooltip.style("display", "none");
        }

        arcs.on("mouseover", (event, d) => {
            highlight(d.data.priority);
            tooltip.style("display", "block")
                .html(`<div><strong>${d.data.priority}</strong><br>
             Count: ${d.data.count.toLocaleString()}<br>
             Percentage: ${(d.data.count / total * 100).toFixed(2)}%</div>`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }).on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }).on("mouseout", () => resetHighlight());

        legendItems.on("mouseover", (event, d) => {
            highlight(d.priority);
            tooltip.style("display", "block")
                .html(`<div><strong>${d.priority}</strong><br>
             Count: ${d.count.toLocaleString()}<br>
             Percentage: ${(d.count / total * 100).toFixed(2)}%</div>`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }).on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }).on("mouseout", () => resetHighlight());

        console.log("Priority counts (grouped):", counts);
    });