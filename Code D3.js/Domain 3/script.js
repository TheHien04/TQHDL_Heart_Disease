const svg = d3.select("svg"),
      margin = {top: 40, right: 200, bottom: 100, left: 60},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3.select(".tooltip");

let currentData;

const x0 = d3.scaleBand().padding(0.2).range([0, width]);
const x1 = d3.scaleBand().padding(0.05);
const y = d3.scaleLinear().range([height, 0]);
const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#f28e2b", "#4e79a7"]);
const keys = ["Yes", "No"];

d3.csv("../Preprocessing_project_heart_disease.csv").then(data => {
  const originalData = d3.rollup(
    data.filter(d => d.Smoking === "Yes" || d.Smoking === "No"),
    v => ({
      Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
      No: v.filter(d => d["Heart Disease Status"] === "No").length
    }),
    d => d.Smoking
  );

  currentData = Array.from(originalData, ([smoking, counts]) => ({
    Smoking: smoking,
    ...counts,
    Total: counts.Yes + counts.No
  })).sort((a, b) => {
    const order = ["Yes", "No"];
    return order.indexOf(a.Smoking) - order.indexOf(b.Smoking);
  });

  if (currentData.length === 0 || currentData.every(d => d.Total === 0)) {
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Không có dữ liệu hợp lệ để hiển thị. Vui lòng kiểm tra file CSV.");
    return;
  }

  drawChart();
}).catch(error => {
  console.error("Lỗi khi tải CSV:", error);
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text("Lỗi khi tải dữ liệu. Vui lòng kiểm tra file CSV.");
});

function drawChart() {
  g.selectAll("*").remove();

  x0.domain(currentData.map(d => d.Smoking));
  x1.domain(keys).range([0, x0.bandwidth()]);
  y.domain([0, d3.max(currentData, d => Math.max(d.Yes, d.No))]).nice();

  // Gridlines ngang (trục y), không hiển thị ở y=0
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
      .ticks(10)
    )
    .selectAll("line")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2")
    .filter(function(d) { return d > 0; });

  // Trục x
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickFormat(d => d === "Yes" ? "Có" : "Không"))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Tình trạng hút thuốc");

  // Trục y
  g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).tickFormat(d3.format(".0f")))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Số lượng");

  // Grouped bar chart
  g.selectAll(".bar-group")
    .data(currentData)
    .join("g")
    .attr("class", "bar-group")
    .attr("transform", d => `translate(${x0(d.Smoking)},0)`)
    .selectAll("rect")
    .data(d => keys.map(key => ({key, value: d[key], total: d.Total, smoking: d.Smoking})))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", d => color(d.key))
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill-opacity", 1);
      g.selectAll("rect").filter(e => e !== d).attr("fill-opacity", 0.3);
      const percent = ((d.value / d.total) * 100).toFixed(1);
      tooltip.style("opacity", 1)
             .html(`
               Hút thuốc: ${d.smoking === "Yes" ? "Có" : "Không"}<br/>
               Bệnh tim: ${d.key === "Yes" ? "Có" : "Không"}<br/>
               Số lượng: ${d.value}<br/>
               Tỷ lệ: ${percent}%
             `)
             .style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      const relatedTarget = event.relatedTarget;
      if (relatedTarget && relatedTarget.className === "tooltip") {
        return;
      }
      g.selectAll("rect").attr("fill-opacity", 1);
      tooltip.style("opacity", 0);
    });

  tooltip.on("mouseleave", function() {
    g.selectAll("rect").attr("fill-opacity", 1);
    tooltip.style("opacity", 0);
  });

  // Legend (xếp ngang, bên phải, với khoảng cách động)
  const legendData = [
    { label: "Mắc bệnh", color: "#f28e2b" },
    { label: "Không mắc bệnh", color: "#4e79a7" }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

  legend.selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => {
      const prevWidth = i > 0 ? legendData.slice(0, i).reduce((sum, item) => sum + (item.label.length * 7 + 25), 0) : 0;
      return `translate(${prevWidth},0)`;
    })
    .each(function(d) {
      d3.select(this)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d.color);
      d3.select(this)
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", "12px")
        .text(d.label);
    });
}