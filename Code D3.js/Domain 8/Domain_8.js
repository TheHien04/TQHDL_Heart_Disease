const svg = d3.select("svg"),
      margin = {top: 60, right: 100, bottom: 80, left: 60},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

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
        .text("Không có dữ liệu để hiển thị.");
      return;
    }

    const rawExtent = d3.extent(data, d => d.Cholesterol);
    const cholesterolExtent = [rawExtent[0], 320];
    const binWidth = 10;
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

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickFormat(d => `${d}-${d + binWidth}`).tickValues(thresholds.filter(d => d !== 320 && d !== 310)))  // Loại bỏ các khoảng 320-330 và 310-320
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Số lượng");

    // Bars
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
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", color(d.key));

        tooltip.style("opacity", 0);
      });

    // Legend
    const legendData = [
      {label: "nam", color: "#E88284"},
      {label: "nữ", color: "#4A89C7"}
    ];

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 60},${margin.top - 50})`);

    legend.append("text")
      .attr("x", -20)
      .attr("y", -10)
      .attr("text-anchor", "start")
      .attr("font-size", "14px")
      .text("Giới tính");

    legend.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0,${i * 20})`)
      .each(function(d) {
        d3.select(this)
          .append("rect")
          .attr("x", -20)
          .attr("y", 0)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", d.color);
        d3.select(this)
          .append("text")
          .attr("x", 0)
          .attr("y", 12)
          .attr("font-size", "12px")
          .text(d.label);
      });

    // Thêm chú thích cho đơn vị mg/dL
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)  // Đặt xuống dưới trục x
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Đơn vị: mg/dL");
  })
  .catch(error => {
    console.error("Lỗi khi tải CSV:", error);
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Lỗi khi tải dữ liệu.");
  });
