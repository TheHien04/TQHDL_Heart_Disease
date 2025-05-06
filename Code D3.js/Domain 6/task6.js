// Domain 6: BMI và tình trạng bệnh tim (Box Plot)
function drawChart6() {
  const svg = d3.select("#chart-6 svg");
  const tooltip = d3.select("#chart-6 .tooltip");
  const baseWidth = 400;
  const baseHeight = 400;
  const margin = { top: 20, right: 60, bottom: 50, left: 40 };
  const chartWidth = baseWidth - margin.left - margin.right;
  const chartHeight = baseHeight - margin.top - margin.bottom;
  
  // Create chart group
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv("../Preprocessing_project_heart_disease.csv").then(data => {
    // Parse data
    data.forEach(d => {
      d.BMI = +d.BMI;
      d.status = d["Heart Disease Status"];
    });

    // Group data by heart disease status
    const groupedData = d3.group(data, d => d.status);
    const statuses = ["No", "Yes"];
    const boxData = statuses.map(status => {
      const values = groupedData.get(status)?.map(d => d.BMI).sort(d3.ascending) || [];
      if (values.length === 0) return null; // Handle empty data
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const min = Math.max(q1 - 1.5 * iqr, d3.min(values));
      const max = Math.min(q3 + 1.5 * iqr, d3.max(values));
      const outliers = values.filter(v => v < min || v > max);
      return { status, q1, median, q3, min, max, outliers, values };
    }).filter(d => d !== null);

    if (boxData.length === 0) {
      svg.append("text")
        .attr("x", baseWidth / 2)
        .attr("y", baseHeight / 2)
        .attr("text-anchor", "middle")
        .text("No data available");
      return;
    }

    // Define scales
    const x = d3.scaleBand()
      .domain(statuses)
      .range([0, chartWidth])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([d3.min(boxData, d => d.min) - 2, d3.max(boxData, d => d.max) + 2])
      .nice()
      .range([chartHeight, 0]);

    // Draw box plots
    const boxWidth = x.bandwidth() * 0.8;

    boxData.forEach(d => {
      const xPos = x(d.status);

      // Draw whiskers
      g.append("line")
        .attr("x1", xPos + boxWidth / 2)
        .attr("x2", xPos + boxWidth / 2)
        .attr("y1", y(d.min))
        .attr("y2", y(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Draw whisker caps
      g.append("line")
        .attr("x1", xPos + boxWidth * 0.25)
        .attr("x2", xPos + boxWidth * 0.75)
        .attr("y1", y(d.min))
        .attr("y2", y(d.min))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      g.append("line")
        .attr("x1", xPos + boxWidth * 0.25)
        .attr("x2", xPos + boxWidth * 0.75)
        .attr("y1", y(d.max))
        .attr("y2", y(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Draw box (Q1 to Q3)
      g.append("rect")
        .attr("x", xPos)
        .attr("y", y(d.q3))
        .attr("width", boxWidth)
        .attr("height", y(d.q1) - y(d.q3))
        .attr("fill", d.status === "Yes" ? "#f28e2b" : "#4e79a7")
        .attr("opacity", 0.7)
        .on("mouseover", function(event) {
          tooltip.style("opacity", 1)
            .html(`Tình trạng: ${d.status === "Yes" ? "Có" : "Không"}<br>Trung vị: ${d.median.toFixed(1)}<br>Q1: ${d.q1.toFixed(1)}<br>Q3: ${d.q3.toFixed(1)}<br>Min: ${d.min.toFixed(1)}<br>Max: ${d.max.toFixed(1)}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      // Draw median line
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos + boxWidth)
        .attr("y1", y(d.median))
        .attr("y2", y(d.median))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5);

      // Draw outliers
      if (d.outliers.length > 0) {
        g.selectAll(`.outlier-${d.status}`)
          .data(d.outliers)
          .enter()
          .append("circle")
          .attr("cx", xPos + boxWidth / 2)
          .attr("cy", v => y(v))
          .attr("r", 2)
          .attr("fill", d.status === "Yes" ? "#f28e2b" : "#4e79a7")
          .attr("opacity", 0.6)
          .on("mouseover", function(event, v) {
            tooltip.style("opacity", 1)
              .html(`Tình trạng: ${d.status === "Yes" ? "Có" : "Không"}<br>BMI ngoại lai: ${v.toFixed(1)}`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 10) + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      }
    });

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => d === "Yes" ? "Có" : "Không"))
      .selectAll("text")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    // Add axis labels
    svg.append("text")
      .attr("x", baseWidth / 2)
      .attr("y", baseHeight - 10)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Tình trạng bệnh tim");

    svg.append("text")
      .attr("x", -baseHeight / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("BMI");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${baseWidth - 120},${margin.top})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "#4e79a7");

    legend.append("text")
      .attr("x", 15)
      .attr("y", 9)
      .style("font-size", "10px")
      .text("Không mắc bệnh tim");

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 15)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "#f28e2b");

    legend.append("text")
      .attr("x", 15)
      .attr("y", 24)
      .style("font-size", "10px")
      .text("Mắc bệnh tim");
  }).catch(error => {
    console.error("Error loading the CSV file:", error);
    svg.append("text")
      .attr("x", baseWidth / 2)
      .attr("y", baseHeight / 2)
      .attr("text-anchor", "middle")
      .text("Error loading data");
  });
}

// Call the function to draw the chart
drawChart6();