document.addEventListener("DOMContentLoaded", () => {
    // Danh sách các biểu đồ
    const charts = [
        { id: "chart1", title: "", type: "bar" },
        { id: "chart2", title: "", type: "pie" },
        { id: "chart3", title: "", type: "groupedBar" },
        { id: "chart4", title: "", type: "stackedBar" },
        { id: "chart5", title: "", type: "cholesterolBar" },
        { id: "chart6", title: "", type: "boxPlot" },
        { id: "chart7", title: "", type: "familyHistoryPie" },
        { id: "chart8", title: "", type: "histogram" }
    ];

    // Hàm vẽ biểu đồ cột theo nhóm tuổi (Domain 1)
    function drawBarChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing bar chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        const ageBins = [16, 24, 32, 40, 48, 56, 64, 72, 80];
        const ageLabels = ["<16", "16-24", "24-32", "32-40", "40-48", "48-56", "56-64", "64-72", "72-80", ">80"];

        const getAgeGroup = (age) => {
            if (age < 16) return "<16";
            if (age >= 80) return ">80";
            for (let i = 0; i < ageBins.length - 1; i++) {
                if (age >= ageBins[i] && age < ageBins[i + 1]) {
                    return `${ageBins[i]}-${ageBins[i + 1]}`;
                }
            }
            return ">80";
        };

        filteredData.forEach(d => {
            d.Age = +d.Age;
            d.AgeGroup = getAgeGroup(d.Age);
        });

        const groupedData = d3.rollup(
            filteredData,
            v => v.length,
            d => d.AgeGroup,
            d => d["Heart Disease Status"]
        );

        const processedData = [];
        ageLabels.forEach(ageGroup => {
            const statusMap = groupedData.get(ageGroup) || new Map();
            processedData.push({
                ageGroup,
                Yes: statusMap.get("Yes") || 0,
                No: statusMap.get("No") || 0
            });
        });

        const width = 400; // Tăng cho nhiều cột
        const height = 340;
        const margin = { top: 30, right: 20, bottom: 80, left: 40 };

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "bar_chart-container");

        const x = d3.scaleBand()
            .domain(ageLabels)
            .range([margin.left, width - margin.right])
            .paddingInner(0.2)
            .paddingOuter(0.1);

        const yMax = d3.max(processedData, d => Math.max(d.Yes, d.No));
        const y = d3.scaleLinear()
            .domain([0, yMax > 0 ? yMax : 1])
            .nice()
            .range([height - margin.bottom, margin.top]);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        svg.selectAll(`.bar-yes-${containerId}`)
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", `bar bar-yes-${containerId}`)
            .attr("x", d => x(d.ageGroup))
            .attr("y", d => y(d.Yes))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - margin.bottom - y(d.Yes))
            .attr("fill", "steelblue")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`Age Group: ${d.ageGroup}<br>Status: Yes<br>Count: ${d.Yes}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        svg.selectAll(`.bar-no-${containerId}`)
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", `bar bar-no-${containerId}`)
            .attr("x", d => x(d.ageGroup) + x.bandwidth() / 2)
            .attr("y", d => y(d.No))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - margin.bottom - y(d.No))
            .attr("fill", "lightcoral")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`Age Group: ${d.ageGroup}<br>Status: No<br>Count: ${d.No}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "7px")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em");

        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "7px");

        svg.append("text")
            .attr("class", "axis-label x-label")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom + 30)
            .style("font-size", "8px")
            .style("text-anchor", "middle")
            .text("Age Group");

        svg.append("text")
            .attr("class", "axis-label y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left - 30)
            .style("font-size", "8px")
            .style("text-anchor", "middle")
            .text("Number of Patients");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ tròn (Domain 2)
    function drawPieChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing pie chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        const groupedData = d3.rollup(
            filteredData,
            v => v.length,
            d => d.Gender,
            d => d["Heart Disease Status"]
        );

        const maleData = [
            { status: "Yes", count: groupedData.get("Male")?.get("Yes") || 0 },
            { status: "No", count: groupedData.get("Male")?.get("No") || 0 }
        ];
        const femaleData = [
            { status: "Yes", count: groupedData.get("Female")?.get("Yes") || 0 },
            { status: "No", count: groupedData.get("Female")?.get("No") || 0 }
        ];

        const maleTotal = d3.sum(maleData, d => d.count);
        const femaleTotal = d3.sum(femaleData, d => d.count);
        maleData.forEach(d => d.percent = maleTotal > 0 ? (d.count / maleTotal * 100) : 0);
        femaleData.forEach(d => d.percent = femaleTotal > 0 ? (d.count / femaleTotal * 100) : 0);

        const width = 429; // Giảm cho pie chart
        const height = 340;
        const radius = Math.min(width / 2, height - 80) / 2;

        container.selectAll("svg").remove();
        const svgContainer = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "pie_chart-container");

        svgContainer.append("text")
            .attr("x", width / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        const maleSvg = svgContainer.append("g")
            .attr("transform", `translate(${width / 4}, ${height / 2})`);

        const femaleSvg = svgContainer.append("g")
            .attr("transform", `translate(${3 * width / 4}, ${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(["Yes", "No"])
            .range(["steelblue", "lightcoral"]);

        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius + 0);

        const maleArcs = maleSvg.selectAll(".arc")
            .data(pie(maleData))
            .enter()
            .append("g")
            .attr("class", "arc");

        maleArcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.status))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`Gender: Male<br>Status: ${d.data.status}<br>Count: ${d.data.count}<br>Percent: ${d.data.percent.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        maleArcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .style("font-size", "7px")
            .text(d => d.data.percent > 0 ? `${d.data.percent.toFixed(1)}%` : "");

        maleSvg.append("text")
            .attr("x", 0)
            .attr("y", -radius - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "8px")
            .text("Male");

        const femaleArcs = femaleSvg.selectAll(".arc")
            .data(pie(femaleData))
            .enter()
            .append("g")
            .attr("class", "arc");

        femaleArcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.status))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`Gender: Female<br>Status: ${d.data.status}<br>Count: ${d.data.count}<br>Percent: ${d.data.percent.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        femaleArcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("class", "label")
            .style("font-size", "7px")
            .text(d => d.data.percent > 0 ? `${d.data.percent.toFixed(1)}%` : "");

        femaleSvg.append("text")
            .attr("x", 0)
            .attr("y", -radius - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "8px")
            .text("Female");
    }

    // Hàm vẽ biểu đồ cột nhóm (Domain 3)
    function drawGroupedBarChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing grouped bar chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        const originalData = d3.rollup(
            filteredData.filter(d => d.Smoking === "Yes" || d.Smoking === "No"),
            v => ({
                Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
                No: v.filter(d => d["Heart Disease Status"] === "No").length
            }),
            d => d.Smoking
        );

        const currentData = Array.from(originalData, ([smoking, counts]) => ({
            Smoking: smoking,
            ...counts,
            Total: counts.Yes + counts.No
        })).sort((a, b) => {
            const order = ["Yes", "No"];
            return order.indexOf(a.Smoking) - order.indexOf(b.Smoking);
        });

        const margin = { top: 30, right: 100, bottom: 80, left: 70 };
        const width = 500 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 400)
            .attr("height", 340)
            .attr("class", "grouped_bar_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (currentData.length === 0 || currentData.every(d => d.Total === 0)) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

        const x0 = d3.scaleBand().padding(0.2).range([0, width]);
        const x1 = d3.scaleBand().padding(0.05);
        const y = d3.scaleLinear().range([height, 0]);
        const color = d3.scaleOrdinal()
            .domain(["Yes", "No"])
            .range(["steelblue", "lightcoral"]);
        const keys = ["Yes", "No"];

        x0.domain(currentData.map(d => d.Smoking));
        x1.domain(keys).range([0, x0.bandwidth()]);
        y.domain([0, d3.max(currentData, d => Math.max(d.Yes, d.No))]).nice();

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

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0).tickFormat(d => d === "Yes" ? "Có" : "Không"))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Tình trạng hút thuốc");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0f")))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Số lượng");

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
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                g.selectAll("rect").filter(e => e !== d).attr("opacity", 0.3);
                const percent = ((d.value / d.total) * 100).toFixed(1);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
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
                if (relatedTarget && relatedTarget.className === `tooltip-${containerId}`) {
                    return;
                }
                g.selectAll("rect").attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        tooltip.on("mouseleave", function() {
            g.selectAll("rect").attr("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        });

        svg.append("text")
            .attr("x", 440 / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ cột xếp chồng (Domain 4)
    function drawStackedBarChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing stacked bar chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        const originalData = d3.rollup(
            filteredData.filter(d => ["High", "Medium", "Low"].includes(d["Exercise Habits"])),
            v => ({
                Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
                No: v.filter(d => d["Heart Disease Status"] === "No").length
            }),
            d => d["Exercise Habits"]
        );

        const currentData = Array.from(originalData, ([exercise, counts]) => ({
            Exercise: exercise,
            ...counts,
            Total: counts.Yes + counts.No
        })).sort((a, b) => {
            const order = ["High", "Medium", "Low"];
            return order.indexOf(a.Exercise) - order.indexOf(b.Exercise);
        });

        const margin = { top: 30, right: 100, bottom: 80, left: 90 };
        const width = 530 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 330)
            .attr("height", 340)
            .attr("class", "stacked_bar_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (currentData.length === 0 || currentData.every(d => d.Total === 0)) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

        const x = d3.scaleBand().padding(0.2).range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const color = d3.scaleOrdinal()
            .domain(["Yes", "No"])
            .range(["steelblue", "lightcoral"]);
        const keys = ["Yes", "No"];

        x.domain(currentData.map(d => d.Exercise));
        y.domain([0, d3.max(currentData, d => d.Total)]).nice();

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

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => d === "High" ? "Cao" : d === "Medium" ? "Trung bình" : "Thấp"))
            .append("text")
            .attr("x", width / 2 - 40)
            .attr("y", 40)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Thói quen tập thể dục");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0f")))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Số lượng");

        const stack = d3.stack().keys(keys)(currentData);
        g.selectAll(".serie")
            .data(stack)
            .join("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.Exercise) + (x.bandwidth() - x.bandwidth() * 0.5) / 2)
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth() * 0.5)
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                g.selectAll("rect").filter(e => e !== d).attr("opacity", 0.3);
                const key = d3.select(this.parentNode).datum().key;
                const count = d[1] - d[0];
                const percent = d.data.Total ? ((count / d.data.Total) * 100).toFixed(1) : 0;
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`
                        Tập thể dục: ${d.data.Exercise === "High" ? "Cao" : d.data.Exercise === "Medium" ? "Trung bình" : "Thấp"}<br/>
                        Bệnh tim: ${key === "Yes" ? "Có" : "Không"}<br/>
                        Số lượng: ${count}<br/>
                        Tỷ lệ: ${percent}%
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const relatedTarget = event.relatedTarget;
                if (relatedTarget && relatedTarget.className === `tooltip-${containerId}`) {
                    return;
                }
                g.selectAll("rect").attr("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        tooltip.on("mouseleave", function() {
            g.selectAll("rect").attr("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        });

        svg.append("text")
            .attr("x", 430 / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ cột cholesterol (Domain 5)
    function drawCholesterolBarChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing cholesterol bar chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        filteredData.forEach(d => d["Cholesterol Level"] = +d["Cholesterol Level"]);

        const avgData = d3.rollups(
            filteredData,
            v => d3.mean(v, d => d["Cholesterol Level"]),
            d => d["Heart Disease Status"]
        ).map(([status, avg]) => ({ status, avg }));

        const margin = { top: 30, right: 20, bottom: 60, left: 60 };
        const width = 330 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 330)
            .attr("height", 340)
            .attr("class", "cholesterol_bar_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (avgData.length === 0 || avgData.every(d => d.avg === 0 || isNaN(d.avg))) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

        const x = d3.scaleBand()
            .domain(avgData.map(d => d.status))
            .range([0, width])
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, d3.max(avgData, d => d.avg)])
            .nice()
            .range([height, 0]);

        g.selectAll("rect")
            .data(avgData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.status))
            .attr("y", d => y(d.avg))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.avg))
            .attr("fill", d => d.status === "Yes" ? "steelblue" : "lightcoral")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                    .html(`Status: ${d.status}<br>Avg Cholesterol: ${d.avg.toFixed(1)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.transition().duration(300).style("opacity", 0);
            });

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Heart Disease Status");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Avg Cholesterol Level");

        svg.append("text")
            .attr("x", 330 / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ box plot (Domain 6)
    function drawBoxPlotChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing box plot chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        filteredData.forEach(d => {
            d.BMI = +d.BMI;
            d.status = d["Heart Disease Status"];
        });

        const groupedData = d3.group(filteredData, d => d.status);
        const statuses = ["No", "Yes"];
        const boxData = statuses.map(status => {
            const values = groupedData.get(status)?.map(d => d.BMI).sort(d3.ascending) || [];
            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const iqr = q3 - q1;
            const min = Math.max(q1 - 1.5 * iqr, d3.min(values));
            const max = Math.min(q3 + 1.5 * iqr, d3.max(values));
            const outliers = values.filter(v => v < min || v > max);
            return { status, q1, median, q3, min, max, outliers, values };
        });

        const margin = { top: 30, right: 50, bottom: 60, left: 60 };
        const width = 430 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 330)
            .attr("height", 340)
            .attr("class", "box_plot_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (boxData.every(d => d.values.length === 0)) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

        const x = d3.scaleBand()
            .domain(statuses)
            .range([0, width])
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([d3.min(boxData, d => d.min) - 2, d3.max(boxData, d => d.max) + 2])
            .nice()
            .range([height, 0]);

        const boxWidth = x.bandwidth() * 0.8;

        boxData.forEach(d => {
            if (d.values.length === 0) return;

            const xPos = x(d.status);

            g.append("line")
                .attr("x1", xPos + boxWidth / 2)
                .attr("x2", xPos + boxWidth / 2)
                .attr("y1", y(d.min))
                .attr("y2", y(d.max))
                .attr("stroke", "black")
                .attr("stroke-width", 1);

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

            g.append("rect")
                .attr("x", xPos)
                .attr("y", y(d.q3))
                .attr("width", boxWidth)
                .attr("height", y(d.q1) - y(d.q3))
                .attr("fill", d.status === "Yes" ? "steelblue" : "lightcoral")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    d3.select(this).attr("opacity", 0.9);
                    tooltip.style("opacity", 1)
                        .html(`Tình trạng: ${d.status === "Yes" ? "Có" : "Không"}<br>Trung vị: ${d.median.toFixed(1)}<br>Q1: ${d.q1.toFixed(1)}<br>Q3: ${d.q3.toFixed(1)}<br>Min: ${d.min.toFixed(1)}<br>Max: ${d.max.toFixed(1)}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("opacity", 0.7);
                    tooltip.style("opacity", 0);
                });

            g.append("line")
                .attr("x1", xPos)
                .attr("x2", xPos + boxWidth)
                .attr("y1", y(d.median))
                .attr("y2", y(d.median))
                .attr("stroke", "black")
                .attr("stroke-width", 1.5);

            if (d.outliers.length > 0) {
                g.selectAll(`.outlier-${d.status}-${containerId}`)
                    .data(d.outliers)
                    .enter()
                    .append("circle")
                    .attr("cx", xPos + boxWidth / 2)
                    .attr("cy", v => y(v))
                    .attr("r", 2)
                    .attr("fill", d.status === "Yes" ? "steelblue" : "lightcoral")
                    .attr("opacity", 0.6)
                    .on("mouseover", function(event, v) {
                        d3.select(this).attr("opacity", 1);
                        tooltip.style("opacity", 1)
                            .html(`Tình trạng: ${d.status === "Yes" ? "Có" : "Không"}<br>BMI ngoại lai: ${v.toFixed(1)}`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 10) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", 0.6);
                        tooltip.style("opacity", 0);
                    });
            }
        });

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => d === "Yes" ? "Có" : "Không"))
            .append("text")
            .attr("x", width / 2 -20)
            .attr("y", 50)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Heart Disease Status");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(5))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -30)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("BMI");

        svg.append("text")
            .attr("x", 330 / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ tròn theo tiền sử gia đình (Domain 7)
    function drawFamilyHistoryPieChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing pie chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (isNaN(age)) return false;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        const originalData = d3.rollup(
            filteredData.filter(d => d["Family Heart Disease"] === "Yes" || d["Family Heart Disease"] === "No"),
            v => {
                const yesCount = v.filter(d => d["Heart Disease Status"] === "Yes").length;
                const noCount = v.filter(d => d["Heart Disease Status"] === "No").length;
                const total = yesCount + noCount;
                return {
                    Yes: total > 0 ? (yesCount / total * 100) : 0,
                    No: total > 0 ? (noCount / total * 100) : 0,
                    YesCount: yesCount,
                    NoCount: noCount,
                    Total: total
                };
            },
            d => d["Family Heart Disease"]
        );

        const currentData = Array.from(originalData, ([FamilyHistory, counts]) => ({
            FamilyHistory,
            ...counts
        }));

        const margin = { top: 30, right: -100, bottom: 60, left: 30 };
        const width = 290 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 490)
            .attr("height", 340)
            .attr("class", "pie_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (currentData.length === 0 || currentData.every(d => d.Total === 0)) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

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
            .innerRadius(radius - 40)
            .outerRadius(radius - 40);

        const piePositions = [
            { x: width / 4, y: height / 2, label: "Yes" },
            { x: 3 * width / 4, y: height / 2, label: "No" }
        ];

        piePositions.forEach((pos, i) => {
            const dataItem = currentData.find(d => d.FamilyHistory === pos.label);
            if (!dataItem || dataItem.Total === 0) return;

            const pieData = pie(keys.map(key => ({
                key: key,
                value: dataItem[key],
                count: dataItem[key === "Yes" ? "YesCount" : "NoCount"]
            })));

            const pieGroup = g.append("g")
                .attr("transform", `translate(${pos.x},${pos.y})`);

            pieGroup.selectAll(".arc")
                .data(pieData)
                .enter()
                .append("path")
                .attr("class", "arc")
                .attr("d", arc)
                .attr("fill", d => color(d.data.key))
                .attr("opacity", 0.7)
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("opacity", 0.9);
                    tooltip.style("opacity", 1)
                        .html(`Tình trạng: ${d.data.key === "Yes" ? "Mắc bệnh" : "Không mắc bệnh"}<br>Phần trăm: ${d.data.value.toFixed(1)}%<br>Số lượng: ${d.data.count}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("opacity", 0.7);
                    tooltip.style("opacity", 0);
                });

            pieGroup.selectAll(".label")
                .data(pieData)
                .enter()
                .append("text")
                .attr("transform", d => `translate(${labelArc.centroid(d)})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("fill", d => d.data.key === "No" ? "#fff" : "#000")
                .text(d => d.data.value.toFixed(1) + "%")
                .style("font-size", "10px")
                .style("font-weight", "bold");

            pieGroup.append("text")
                .attr("y", radius + 20)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(pos.label === "Yes" ? "Có" : "Không");
        });

        svg.append("text")
            .attr("x", 290 / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(title);
    }

    // Hàm vẽ biểu đồ histogram (Domain 8)
    function drawHistogramChart(containerId, data, title, ageFilter = "all", statusFilter = "all") {
        console.log(`Drawing histogram chart for ${containerId}, title: ${title}`);

        const container = d3.select(`#${containerId}`);
        if (container.empty()) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        if (!data || data.length === 0) {
            console.error(`Invalid or empty data for ${containerId}`);
            return;
        }

        let filteredData = data;
        if (ageFilter !== "all") {
            filteredData = filteredData.filter(d => {
                const age = +d.Age;
                if (isNaN(age)) return false;
                if (ageFilter === "<16") return age < 16;
                if (ageFilter === ">80") return age >= 80;
                const [min, max] = ageFilter.split("-").map(Number);
                return age >= min && age < max;
            });
        }
        if (statusFilter !== "all") {
            filteredData = filteredData.filter(d => d["Heart Disease Status"] === statusFilter);
        }

        filteredData = filteredData
            .filter(d => d.Gender === "Male" || d.Gender === "Female")
            .map(d => ({
                Gender: d.Gender,
                Cholesterol: +d["Cholesterol Level"]
            }))
            .filter(d => !isNaN(d.Cholesterol) && d.Cholesterol > 0);

        const margin = { top: 30, right: 50, bottom: 60, left: 40 };
        const width = 500 - margin.left - margin.right;
        const height = 340 - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container
            .append("svg")
            .attr("width", 420)
            .attr("height", 340)
            .attr("class", "histogram_chart-container");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(`.tooltip-${containerId}`).remove();
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", `tooltip-${containerId}`)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px");

        if (filteredData.length === 0) {
            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Không có dữ liệu hợp lệ để hiển thị.");
            return;
        }

        const rawExtent = d3.extent(filteredData, d => d.Cholesterol);
        const cholesterolExtent = [rawExtent[0], 320];
        const binWidth = 10;
        const thresholds = d3.range(Math.floor(cholesterolExtent[0]), cholesterolExtent[1] + binWidth, binWidth);

        const maleData = filteredData.filter(d => d.Gender === "Male");
        const femaleData = filteredData.filter(d => d.Gender === "Female");

        const maleBins = d3.histogram()
            .value(d => d.Cholesterol)
            .domain(cholesterolExtent)
            .thresholds(thresholds)(maleData);
        const femaleBins = d3.histogram()
            .value(d => d.Cholesterol)
            .domain(cholesterolExtent)
            .thresholds(thresholds)(femaleData);

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
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0)
                .tickFormat(d => `${d}-${d + binWidth}`)
                .tickValues(thresholds.filter(d => d !== 320 && d !== 310)))
            .selectAll("text")
            .style("font-size", "7px")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end")
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Cholesterol Level (mg/dL)");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(5))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -30)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Số lượng");

        const barGroups = g.selectAll(".bar-group")
            .data(binData)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => `translate(${x0(d.x0)},0)`);

        barGroups.selectAll("rect")
            .data(d => groups.map(gender => ({ key: gender, value: d[gender], x0: d.x0, x1: d.x1 })))
            .enter()
            .append("rect")
            .attr("x", d => x1(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => color(d.key))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.9);
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.key === "Male" ? "Nam" : "Nữ"}:</strong> ${d.value} người<br><strong>Khoảng:</strong> ${d.x0}–${d.x1} mg/dL`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                tooltip.style("opacity", 0);
            });

        const legendData = [
            { label: "Nam", color: "#E88284" },
            { label: "Nữ", color: "#4A89C7" }
        ];
        const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 80}, 10)`); // Đặt chú thích ở góc trên bên phải

    svg.append("text")
        .attr("x", 330 / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(title);
}

 // Tải dữ liệu CSV
 d3.csv("../Preprocessing_project_heart_disease.csv").then(data => {
    console.log("CSV loaded successfully, data length:", data.length);

    // Vẽ tất cả biểu đồ ban đầu
    charts.forEach(chart => {
        try {
            if (chart.type === "bar") {
                drawBarChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "pie") {
                drawPieChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "groupedBar") {
                drawGroupedBarChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "stackedBar") {
                drawStackedBarChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "cholesterolBar") {
                drawCholesterolBarChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "boxPlot") {
                drawBoxPlotChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "familyHistoryPie") {
                drawFamilyHistoryPieChart(chart.id, data, chart.title, "all", "all");
            } else if (chart.type === "histogram") {
                drawHistogramChart(chart.id, data, chart.title, "all", "all");
            }
        } catch (error) {
            console.error(`Error drawing chart for ${chart.id}:`, error);
        }
    });

    // Xử lý bộ lọc theo nhóm tuổi
    d3.select("#age-group-filter").on("change", function() {
        const ageFilter = this.value;
        console.log("Age filter changed to:", ageFilter);
        charts.forEach(chart => {
            try {
                if (chart.type === "bar") {
                    drawBarChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "pie") {
                    drawPieChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "groupedBar") {
                    drawGroupedBarChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "stackedBar") {
                    drawStackedBarChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "cholesterolBar") {
                    drawCholesterolBarChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "boxPlot") {
                    drawBoxPlotChart(chart.id, data, chart.title, ageFilter, "all");
                } else if (chart.type === "familyHistoryPie") {
                    drawFamilyHistoryPieChart(chart.id, data, chart.title, "all", "all");
                } else if (chart.type === "histogram") {
                    drawHistogramChart(chart.id, data, chart.title, "all", "all");
                }
            } catch (error) {
                console.error(`Error updating chart for ${chart.id} with age filter:`, error);
            }
        });
    });

    // Xử lý bộ lọc theo trạng thái bệnh tim
    d3.select("#status-filter").on("change", function() {
        const statusFilter = this.value;
        console.log("Status filter changed to:", statusFilter);
        charts.forEach(chart => {
            try {
                if (chart.type === "bar") {
                    drawBarChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "pie") {
                    drawPieChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "groupedBar") {
                    drawGroupedBarChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "stackedBar") {
                    drawStackedBarChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "cholesterolBar") {
                    drawCholesterolBarChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "boxPlot") {
                    drawBoxPlotChart(chart.id, data, chart.title, "all", statusFilter);
                } else if (chart.type === "familyHistoryPie") {
                    drawFamilyHistoryPieChart(chart.id, data, chart.title, "all", "all");
                } else if (chart.type === "histogram") {
                    drawHistogramChart(chart.id, data, chart.title, "all", "all");
                }
            } catch (error) {
                console.error(`Error updating chart for ${chart.id} with status filter:`, error);
            }
        });
    });
}).catch(error => {
    console.error("Error loading CSV in dashboard.js:", error);
});
});