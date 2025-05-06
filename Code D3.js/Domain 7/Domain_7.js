const svg = d3.select("svg"),
      margin = {top: 40, right: 40, bottom: 80, left: 120},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const radius = Math.min(width / 2, height) / 2;
const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#f28e2b", "#4e79a7"]);
const keys = ["Yes", "No"];

const pie = d3.pie()
  .sort(null)
  .value(d => d.value);

const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius - 10);

const labelArc = d3.arc()
  .innerRadius(radius - 60)
  .outerRadius(radius - 60);

d3.csv("../Preprocessing_project_heart_disease.csv")
  .then(data => {
    console.log("Đã tải CSV thành công:", data);
    const originalData = d3.rollup(
      data.filter(d => d["Family Heart Disease"] === "Yes" || d["Family Heart Disease"] === "No"),
      v => {
        const yesCount = v.filter(d => d["Heart Disease Status"] === "Yes").length;
        const noCount = v.filter(d => d["Heart Disease Status"] === "No").length;
        const total = yesCount + noCount;
        return {
          Yes: total > 0 ? (yesCount / total * 100) : 0, // Percentage
          No: total > 0 ? (noCount / total * 100) : 0,
          YesCount: yesCount,
          NoCount: noCount,
          Total: total
        };
      },
      d => d["Family Heart Disease"]
    );

    console.log("originalData:", originalData);
    const currentData = Array.from(originalData, ([FamilyHistory, counts]) => ({
      FamilyHistory,
      ...counts
    }));
    console.log("currentData:", currentData);
    drawChart(currentData);
  })
  .catch(error => {
    console.error("Lỗi khi tải CSV:", error);
  });

function drawChart(data) {
  g.selectAll("*").remove();

  // Define pie chart positions
  const piePositions = [
    {x: width / 4, y: height / 2, label: "Yes"},
    {x: 3 * width / 4, y: height / 2, label: "No"}
  ];

  // Draw pie charts
  piePositions.forEach((pos, i) => {
    const dataItem = data.find(d => d.FamilyHistory === pos.label);
    if (!dataItem) return;

    const pieData = pie(keys.map(key => ({
      key: key,
      value: dataItem[key],
      count: dataItem[key === "Yes" ? "YesCount" : "NoCount"]
    })));

    const pieGroup = g.append("g")
      .attr("transform", `translate(${pos.x},${pos.y})`);

    // Pie slices
    pieGroup.selectAll(".arc")
      .data(pieData)
      .enter()
      .append("path")
      .attr("class", "arc")
      .attr("d", arc)
      .attr("fill", d => color(d.data.key));

    // Percentage labels
    pieGroup.selectAll(".label")
      .data(pieData)
      .enter()
      .append("text")
      .attr("transform", d => `translate(${labelArc.centroid(d)})`)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", d => d.data.key === "No" ? "#fff" : "#000") // White for blue, black for orange
      .text(d => d.data.value.toFixed(1) + "%")
      .style("font-size", "14px")
      .style("font-weight", "bold");
    // Title below pie chart
    pieGroup.append("text")
      .attr("y", radius + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("class", "pie-title")
      .text(pos.label === "Yes" ? "Có" : "Không");
  });

  // Legend on the left
  const legend = svg.selectAll(".legend").data(keys);
  legend.enter().append("g").attr("class", "legend").merge(legend)
    .attr("transform", (d, i) => `translate(${margin.left - 100},${margin.top + i * 25})`)
    .each(function(d) {
      d3.select(this).html("");
      d3.select(this)
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(d));
      d3.select(this)
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(d === "Yes" ? "Mắc bệnh" : "Không mắc bệnh");
    });
}