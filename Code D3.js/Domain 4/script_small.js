const svg = d3.select("svg"),
      margin = {top: 30, right: 60, bottom: 60, left: 40},
      width = 450 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

d3.csv("../Preprocessing_project_heart_disease.csv")
  .then(data => {
    data = data.filter(d => d.Gender === "Male" || d.Gender === "Female")
               .map(d => ({
                 Gender: d.Gender,
                 Cholesterol: +d["Cholesterol Level"]
               }))
               .filter(d => !isNaN(d.Cholesterol) && d.Cholesterol > 0);

    if (data.length === 0) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .text("Không có dữ liệu để hiển thị.");
      return;
    }

    const rawExtent = d3.extent(data, d => d.Cholesterol);
    const cholesterolExtent = [rawExtent[0], 320];
    const binWidth = 20;
    const thresholds = d3.range(Math.floor(cholesterolExtent[0]), cholesterolExtent[1] + binWidth, binWidth);

    const maleData = data.filter(d => d.Gender === "Male");
    const femaleData = data.filter(d => d.Gender === "Female");

    const maleBins = d3.histogram().value(d => d.Cholesterol).domain(cholesterolExtent).thresholds(thresholds)(maleData);
    const femaleBins = d3.histogram().value(d => d.Cholesterol).domain(cholesterolExtent).thresholds(thresholds)(femaleData);

    const binData = maleBins.map((maleBin, i) => ({
      x0: maleBin.x0,
      x1: maleBin.x1,
      Male: maleBin.length,
      Female: femaleBins[i].length
    }));

    const groups = ["Male", "Female"];
    const color = d3.scaleOrdinal()
      .domain(groups)
      .range(["#E88284", "#4A89C7"]);

    const x0 = d3.scaleBand()
      .domain(binData.map(d => d.x0))
      .range([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(groups)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(binData, d => Math.max(d.Male, d.Female)) + 5])
      .nice()
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickFormat(d => `${d}-${d + binWidth}`).tickValues(thresholds.filter((d, i) => i % 2 === 0 && d !== 320 && d !== 300)))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", "8px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "8px");

    const barGroups = g.selectAll(".bar-group")
      .data(binData)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d.x0)},0)`);

    barGroups.selectAll("rect")
      .data(d => groups.map(gender => ({key: gender, value: d[gender], x0: d.x0, x1: d.x1})))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", "#FFD700");

        tooltip.style("opacity", 1)
               .html(
                 `<strong>${d.key === 'Male' ? 'Nam' : 'Nữ'}:</strong> ${d.value} người<br/>
                  <strong>Khoảng:</strong> ${d.x0}–${d.x1} mg/dL`
               )
               .style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY - 10) + "px")
               .style("font-size", "8px")
               .style("padding", "3px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", color(d.key));

        tooltip.style("opacity", 0);
      });

    const legendData = [
      {label: "Nam", color: "#E88284"},
      {label: "Nữ", color: "#4A89C7"}
    ];

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right + 10},${margin.top - 20})`);

    legend.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0,${i * 15})`)
      .each(function(d) {
        d3.select(this)
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", d.color);
        d3.select(this)
          .append("text")
          .attr("x", 15)
          .attr("y", 8)
          .style("font-size", "8px")
          .text(d.label);
      });
  })
  .catch(error => {
    console.error("Lỗi khi tải CSV:", error);
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .text("Lỗi khi tải dữ liệu.");
  });