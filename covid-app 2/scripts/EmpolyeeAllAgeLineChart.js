function EmpolyeeAllAgeLineChart(empolyeeData, selectedCountry) {
  const parentWidth = $("#allEmpCardWrap").width();
  const margin = { top: 10, right: 100, bottom: 40, left: 50 },
    width = parentWidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#allEmpChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const data = empolyeeData;

  // Create X and Y axis groups
  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);

  const yAxisGroup = svg.append("g").attr("class", "y-axis");

  const tooltip = d3
    .select("#allEmpChart")
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

  // Function to update the chart based on selected country and group
  function updateChart(selectedCountry, selectedGroup) {
    const desiredOrder = ["LREM25TT", "LREM55TT", "LREM24TT"];
    // Filter data for the selected country and group
    const filteredData = data
      .filter(
        (d) =>
          d.Country === selectedCountry &&
          d.Sex === "Total" &&
          ((selectedGroup === "Employee" &&
            d.MEASURE === "EMP_WAP" &&
            ["Y15T24", "Y25T54", "Y55T64"].includes(d.AGE)) ||
            (selectedGroup === "Unemployed" &&
              d.MEASURE === "UNE_LF" &&
              ["Y15T24", "Y25T54", "Y55T64"].includes(d.AGE)))
      )
      .sort((a, b) => parseInt(a.TIME) - parseInt(b.TIME));

    // Group data by SUBJECT
    const sortedNestedData = d3.group(filteredData, (d) => d.AGE);

    // const sortedNestedData = Array.from(nestedData).sort((a, b) => {
    //   return desiredOrder.indexOf(a[0]) - desiredOrder.indexOf(b[0]);
    // });

    // Color scale for different groups
    const colorScale = d3
      .scaleOrdinal()
      .domain(["Y15T24", "Y25T54", "Y55T64"])
      .range(d3.schemeSet2);

    // X and Y scales
    const x = d3
      .scaleBand()
      .domain(filteredData.map((d) => d.TIME))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);

    const t = d3.transition().duration(750);

    // Update X and Y axes
    xAxisGroup
      .transition()
      .duration(500)
      .call(d3.axisBottom(x).tickSizeOuter(0));
    yAxisGroup
      .transition()
      .duration(500)
      .call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.TIME) + x.bandwidth() / 2)
      .y((d) => y(d.Value));

    const mouseMove = function (event, d) {
      tooltip
        .html(
          `<strong>Year: ${d.TIME}</strong><br>${
            d.AGE === "Y15T24"
              ? "15-24 Employment"
              : d[0] === "Y25T54"
              ? "25-54 Employment"
              : "55-64 Employment"
          }: ${d.Value}%`
        )
        .style("left", `${event.layerX + 10}px`)
        .style("top", `${event.layerY}px`);
    };

    // DATA JOIN for lines
    const lines = svg
      .selectAll(".line")
      .data(Array.from(sortedNestedData), (d) => d[0]);

    // EXIT
    lines.exit().remove();

    // UPDATE
    lines
      .transition(t)
      .attr("d", (d) => line(d[1]))
      .style("fill", "none")
      .style("stroke", (d) => colorScale(d[0]));

    // ENTER
    lines
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => line(d[1]))
      .style("fill", "none")
      .style("stroke", (d) => colorScale(d[0]))
      .style("opacity", 0)
      .transition(t)
      .style("opacity", 1);

    // DATA JOIN for dots (circles)
    const dots = svg.selectAll(".dots").data(filteredData, (d) => d.TIME);

    // EXIT
    dots.exit().remove();

    // UPDATE
    dots
      .transition(t)
      .attr("cx", (d) => x(d.TIME) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.Value));

    // ENTER
    dots
      .enter()
      .append("circle")
      .attr("class", "dots")
      .attr("cx", (d) => x(d.TIME) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.Value))
      .attr("r", 5)
      .attr("fill", "white")
      .attr("stroke", (d) => colorScale(d.AGE))
      .style("opacity", 0)
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseleave", mouseLeave)
      .transition(t)
      .style("opacity", 1);

    // Labels at the end of each line
    const labelGroups = svg
      .selectAll(".label-group")
      .data(Array.from(sortedNestedData), (d) => d[0]);

    // EXIT
    labelGroups.exit().transition().duration(500).attr("opacity", 0).remove();

    // UPDATE
    labelGroups
      .transition()
      .duration(500)
      .attr("transform", (d) => {
        const lastDataPoint = d[1][d[1].length - 1];
        return `translate(${x(lastDataPoint.TIME) + x.bandwidth() / 2},${y(
          lastDataPoint.Value
        )})`;
      });

    // ENTER
    labelGroups
      .enter()
      .append("g")
      .attr("class", "label-group")
      .attr("transform", (d) => {
        const lastDataPoint = d[1][d[1].length - 1];
        return `translate(${x(lastDataPoint.TIME) + x.bandwidth() / 2},${y(
          lastDataPoint.Value
        )})`;
      })
      .append("text")
      .attr("x", 6)
      .attr("dy", "0.35em")
      .text((d) =>
        d[0] === "Y15T24"
          ? "15-24 Employment"
          : d[0] === "Y25T54"
          ? "25-54 Employment"
          : "55-64 Employment"
      )
      .style("fill", (d) => colorScale(d[0]))
      .style("font-size", 12)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .attr("alignment-baseline", "middle");
  }

  // Event listener for radio buttons
  $("input[name='inlineRadioOptions']").change(function () {
    const selectedGroup = $(this).val();
    updateChart($("#allLocationDropdown").val(), selectedGroup);
  });

  // Event listener for country dropdown change
  $("#allLocationDropdown").change(function () {
    updateChart(
      $(this).val(),
      $("input[name='inlineRadioOptions']:checked").val()
    );
  });

  // Initial chart render
  updateChart(selectedCountry, "Employee"); // Default to Employee
}
