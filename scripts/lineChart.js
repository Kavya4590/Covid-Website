function calculateStatistics(data) {
  return data.map((record) => {
    return {
      date: d3.timeParse("%Y-%m-%d")(record.date),
      total_cases: record.total_cases,
      total_deaths: record.total_deaths,
      total_vaccinations: record.total_vaccinations,
      hosp_patients: record.hosp_patients,
    };
  });
}

function createChart(container, data, key, color, yLabel, showXAxis) {
  // Set up dimensions
  const parentWidth = $("#cardWidth").width();
  const margin = { top: 10, right: 30, bottom: showXAxis ? 30 : 4, left: 90 },
    width = parentWidth - margin.left - margin.right,
    height = 160 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add X axis --> it is a date format
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width]);

  if (showXAxis) {
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
  }

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d[key])])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y).ticks(4));

  // Add the line
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d[key]));

  const path = svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Add line animation
  const totalLength = path.node().getTotalLength();

  path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(750)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

  const tooltip = d3
    .select(container)
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "4px")
    .style("padding", "10px");

  const mouseOver = function (event, d) {
    tooltip.style("opacity", 1);
  };

  const mouseLeave = function (event, d) {
    tooltip.style("opacity", 0);
  };

  const mouseMove = function (event, d) {
    tooltip
      .html(
        `<strong>${d.date.toLocaleDateString()}</strong><br>${key.replace(
          /_/g,
          " "
        )}: ${d[key].toLocaleString()}`
      )
      .style("left", `${event.layerX + 10}px`)
      .style("top", `${event.layerY}px`);
  };

  // Add dots with animation
  const dots = svg
    .selectAll(".dots")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dots")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d[key]))
    .attr("r", 2)
    .attr("fill", color)
    .attr("opacity", 0)
    .on("mouseover", mouseOver)
    .on("mousemove", mouseMove)
    .on("mouseleave", mouseLeave);

  dots.transition().duration(500).attr("opacity", 1);

  // Add Y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(yLabel);
}

function LineChart(datav) {
  // Clear previous chart
  d3.select("#lineChart").selectAll("*").remove();

  // Calculate statistics
  const statistics = calculateStatistics(datav);

  const keysToShow = [];
  if ($("#cases-checkbox").is(":checked")) {
    keysToShow.push("total_cases");
  }
  if ($("#deaths-checkbox").is(":checked")) {
    keysToShow.push("total_deaths");
  }
  if ($("#vaccinations-checkbox").is(":checked")) {
    keysToShow.push("total_vaccinations");
  }
  if ($("#hospitalized-checkbox").is(":checked")) {
    keysToShow.push("hosp_patients");
  }

  keysToShow.forEach((key, index) => {
    const showXAxis = index === keysToShow.length - 1;
    const color =
      key === "total_cases"
        ? "#1f77b4"
        : key === "total_deaths"
        ? "#d62728"
        : key === "total_vaccinations"
        ? "#2ca02c"
        : "#ff7f0e";
    const yLabel =
      key === "total_cases"
        ? "Cases"
        : key === "total_deaths"
        ? "Deaths"
        : key === "total_vaccinations"
        ? "Vaccinations"
        : "Hospitalized";
    createChart("#lineChart", statistics, key, color, yLabel, showXAxis);
  });
}
