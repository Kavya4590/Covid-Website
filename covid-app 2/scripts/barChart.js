function aggregateData(data, timePeriod) {
  const parseDate = d3.timeParse("%Y-%m-%d");
  const formatMonth = d3.timeFormat("%Y-%m");

  if (timePeriod <= 90) {
    return data.map((d) => ({
      date: parseDate(d.date),
      total_cases: +d.total_cases || 0,
      total_deaths: +d.total_deaths || 0,
      total_vaccinations: +d.total_vaccinations || 0,
      hosp_patients: +d.hosp_patients || 0,
    }));
  }

  // Group data by month
  const groupedData = d3.group(data, (d) => formatMonth(parseDate(d.date)));

  // Aggregate data for each month, using the last date of each month
  const aggregatedData = Array.from(groupedData, ([month, values]) => {
    // Find the last date of the month
    const lastDate = d3.max(values, (d) => parseDate(d.date));

    // Filter the values to keep only the ones corresponding to the last date of the month
    const lastDateValues = values.filter(
      (d) => parseDate(d.date).getTime() === lastDate.getTime()
    );

    // Sum the values for the last date of the month
    return {
      actualDate: lastDate,
      date: d3.timeParse("%Y-%m-%d")(month + "-01"),
      total_cases: d3.sum(lastDateValues, (d) => +d.total_cases || 0),
      total_deaths: d3.sum(lastDateValues, (d) => +d.total_deaths || 0),
      total_vaccinations: d3.sum(
        lastDateValues,
        (d) => +d.total_vaccinations || 0
      ),
      hosp_patients: d3.sum(lastDateValues, (d) => +d.hosp_patients || 0),
    };
  });

  return aggregatedData;
}

function BarChart(datav, timePeriod) {
  // Clear previous chart
  d3.select("#chart").selectAll("*").remove();
  d3.select("#legend").selectAll("*").remove();

  // Calculate statistics
  const statistics = aggregateData(datav, timePeriod);

  // Set up dimensions
  const parentWidth = $("#cardWidth").width();
  const margin = { top: 10, right: 50, bottom: 50, left: 80 };
  const width = parentWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const keys = [
    "total_cases",
    "total_deaths",
    "total_vaccinations",
    "hosp_patients",
  ];

  // Set up scales
  const x = d3.scaleTime().range([0, width]);

  const y = d3.scaleLinear().range([height, 0]);

  const xAxisGroup = g
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);

  const yAxisGroup = g.append("g").attr("class", "y-axis");

  const color = d3.scaleOrdinal().domain(keys).range(d3.schemeCategory10);

  // Tooltip div
  const tooltip = d3
    .select("#chart")
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

  const barWidth = (width / statistics.length) * 0.6;

  // Add legend
  const legend = d3
    .select("#legend")
    .selectAll(".legend")
    .data(keys)
    .enter()
    .append("button")
    .attr("type", "button")
    .attr("class", (d, i) => "btn btn-light legend")
    .on("click", (event, d) => {
      // Remove active class from all buttons
      d3.selectAll(".legend").classed("btn-primary", false);
      d3.selectAll(".legend").classed("btn-light", true);
      // Add active class to the clicked button
      d3.select(event.currentTarget).classed("btn-light", false);
      d3.select(event.currentTarget).classed("btn-primary", true);
      $("#defaultMessage").hide();
      drawBars(d);
    });

  $("#legend > button").hasClass("btn-primary")
    ? $("#defaultMessage").hide()
    : $("#defaultMessage").show();

  function drawBars(selectedKey) {
    const minDate = d3.min(statistics, (d) => d.date);
    const maxDate = d3.max(statistics, (d) => d.date);
    const datePadding = (maxDate - minDate) * 0.05; // Add 5% padding on both sides
    x.domain([
      new Date(minDate.getTime() - datePadding),
      new Date(maxDate.getTime() + datePadding),
    ]);
    y.domain([0, d3.max(statistics, (d) => d[selectedKey])]);

    const t = d3.transition().duration(750);

    // Add X axis
    let xAxisCall;
    if (timePeriod <= 90) {
      xAxisCall = d3
        .axisBottom(x)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat("%b %d"));
    } else {
      xAxisCall = d3
        .axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"));
    }

    xAxisGroup
      .transition(t)
      .call(xAxisCall)
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Draw new y-axis
    yAxisGroup.transition(t).call(d3.axisLeft(y));

    const mouseMove = function (event, d) {
      tooltip
        .html(
          `<strong>${d.actualDate.toLocaleDateString()}</strong><br>${selectedKey.replace(
            /_/g,
            " "
          )}: ${d[selectedKey].toLocaleString()}`
        )
        .style("left", `${event.layerX + 10}px`)
        .style("top", `${event.layerY}px`);
    };

    // Bind data
    const bars = g.selectAll(".bar").data(statistics);

    // Remove old bars
    bars.exit().remove();

    // Update bars
    bars
      .transition(t)
      .attr("x", (d) => x(d.date) - barWidth / 2)
      .attr("y", (d) => y(d[selectedKey]))
      .attr("width", barWidth)
      .attr("height", (d) => height - y(d[selectedKey]))
      .attr("fill", color(selectedKey));

    // Enter new bars
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.date) - barWidth / 2)
      .attr("y", height) // Start at the bottom
      .attr("width", barWidth)
      .attr("height", 0) // Start with height 0
      .attr("fill", color(selectedKey))
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseleave", mouseLeave)
      .transition(t)
      .attr("y", (d) => y(d[selectedKey])) // Animate to the final y position
      .attr("height", (d) => height - y(d[selectedKey])); // Animate to the final height
  }

  // drawBars(keys[0]);

  legend
    .append("div")
    .attr("class", "legend-text")
    .text((d) =>
      d === "hosp_patients" ? "Hospitalized patients" : d.replace(/_/g, " ")
    );
}
