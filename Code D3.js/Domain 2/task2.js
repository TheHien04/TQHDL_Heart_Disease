d3.csv("../Preprocessing_project_heart_disease.csv").then((data) => {
    // Nhóm dữ liệu theo giới tính và tình trạng bệnh
    const groupedData = d3.rollup(
        data,
        v => v.length,
        d => d.Gender,
        d => d["Heart Disease Status"]
    );

    // Chuyển đổi dữ liệu thành mảng cho biểu đồ tròn
    const maleData = [
        { status: "Yes", count: groupedData.get("Male")?.get("Yes") || 0 },
        { status: "No", count: groupedData.get("Male")?.get("No") || 0 }
    ];
    const femaleData = [
        { status: "Yes", count: groupedData.get("Female")?.get("Yes") || 0 },
        { status: "No", count: groupedData.get("Female")?.get("No") || 0 }
    ];

    // Tính tổng và tỷ lệ phần trăm
    const maleTotal = d3.sum(maleData, d => d.count);
    const femaleTotal = d3.sum(femaleData, d => d.count);
    maleData.forEach(d => d.percent = maleTotal > 0 ? (d.count / maleTotal * 100) : 0);
    femaleData.forEach(d => d.percent = femaleTotal > 0 ? (d.count / femaleTotal * 100) : 0);

    // Thiết lập kích thước
    const width = 300, height = 300, radius = Math.min(width, height) / 2;

    // Hàm vẽ biểu đồ tròn
    const drawPieChart = (data, containerId) => {
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "pie_chart-container")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(["Yes", "No"])
            .range(["steelblue", "lightcoral"]);

        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius - 10);

        const arcs = svg.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        // Vẽ các phần của biểu đồ tròn
        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.status));

        // Thêm nhãn tỷ lệ phần trăm
        arcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .text(d => d.data.percent > 0 ? `${d.data.percent.toFixed(1)}%` : "");
    };

    // Vẽ biểu đồ tròn cho Male
    drawPieChart(maleData, "#pie_male");

    // Vẽ biểu đồ tròn cho Female
    drawPieChart(femaleData, "#pie_female");

    // Thêm chú thích (legend) ở trên
    const legendSvg = d3.select("#legend")
        .append("svg")
        .attr("width", 600)
        .attr("height", 50)
        .attr("class", "legend-container");

    const legend = legendSvg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(250, 10)`); // Canh giữa

    legend.append("rect")
        .attr("x", 100)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "steelblue");

    legend.append("text")
        .attr("x", 120)
        .attr("y", 12)
        .text("Heart Disease: Yes");

    legend.append("rect")
        .attr("x", 100)
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "lightcoral");

    legend.append("text")
        .attr("x", 120)
        .attr("y", 32)
        .text("Heart Disease: No");
});