d3.csv("../Preprocessing_project_heart_disease.csv").then(data => {
    data.forEach(d => d["Cholesterol Level"] = +d["Cholesterol Level"]);

    const avgData = d3.rollups(
        data,
        v => d3.mean(v, d => d["Cholesterol Level"]),
        d => d["Heart Disease Status"]
    ).map(([status, avg]) => ({ status, avg }));

    const width = 700, height = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 80 };

    const svg = d3.select("#cholesterol_bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(avgData.map(d => d.status))
        .range([margin.left, width - margin.right - 100]) // trừ khoảng cho legend
        .padding(0.4);

    const y = d3.scaleLinear()
        .domain([0, d3.max(avgData, d => d.avg)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px");

    svg.selectAll("rect")
        .data(avgData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.status))
        .attr("y", d => y(d.avg))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.avg))
        .attr("fill", d => d.status === "Yes" ? "steelblue" : "lightcoral")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Status: ${d.status}<br>Avg Cholesterol: ${d.avg.toFixed(1)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(300).style("opacity", 0);
        });

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", (width - margin.right - 100) / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("class", "axis-label")
        .text("Heart Disease Status");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("fill", "black")
        .attr("class", "axis-label")
        .text("Avg Cholesterol Level");

    // Legend (đưa sang phải)
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 10}, ${margin.top})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "steelblue");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Heart Disease: Yes");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "lightcoral");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 37)
        .text("Heart Disease: No");
});
