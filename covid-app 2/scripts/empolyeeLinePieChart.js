function EmployeeLinePieChart(empolyeeData) {
  const parentWidth = $("#empCardWidth").width();
  const margin = { top: 10, right: 100, bottom: 40, left: 50 },
    width = parentWidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#lineChartMultiple")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const data = empolyeeData;

  // Populate country dropdown
  const countries = [...new Set(data.map((d) => d.Country))].sort();
  const countrySelect = $("#allLocationDropdown");
  const excludedCountries = [
    "Euro area (20 countries)",
    "European Union – 27 countries (from 01/02/2020)",
    "OECD - Total",
    "G7",
    "Türkiye",
  ];

  countries.forEach((country) => {
    if (!excludedCountries.includes(country)) {
      countrySelect.append(new Option(country, country));
    }
  });

  // Default country
  const defaultCountry = "United States";
  countrySelect.val(defaultCountry);

  const tooltip = d3
    .select("#lineChartMultiple")
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

  // Function to update pie chart based on year and country
  function updatePieChart(year, country, empCode) {
    const yearData = data.filter(
      (d) => d.TIME === year && d.Country === country
    );

    // Calculate total values for males and females
    const totalMale = yearData.find((d) => d.SUBJECT === "Male").Value;
    const totalFemale = yearData.find((d) => d.SUBJECT === "Female").Value;

    $("#pieHeading").text(`Year: ${year}`);
    $("#pieCaption").text(
      empCode === "LREM" ? "Gender: Employment" : "Gender: Unemployment"
    );

    // Prepare data for pie chart
    const pieData = [
      { label: "Male", value: totalMale },
      { label: "Female", value: totalFemale },
    ];

    // Remove previous pie chart
    d3.select("#pieChart").selectAll("*").remove();

    // Set up pie chart dimensions
    const parentWidth = $("#pieCardWidth").width();
    const width = parentWidth,
      height = 250;
    const radius = Math.min(width, height) / 2;
    const pieSvg = d3
      .select("#pieChart")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Color scale for pie chart
    const color = d3
      .scaleOrdinal()
      .domain(pieData.map((d) => d.label))
      .range(d3.schemeSet1);

    // Generate pie chart arcs
    const pie = d3
      .pie()
      .value((d) => d.value)
      .startAngle(0)
      .endAngle(2 * Math.PI)
      .sort(null); // Disable sorting for proper animation

    // Generate arcs
    const arcs = pie(pieData);

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    // Draw arcs with animation
    pieSvg
      .selectAll("path")
      .data(arcs)
      .enter()
      .append("path")
      .attr("fill", (d) => color(d.data.label))
      .attr("d", arcGenerator)
      .each(function (d) {
        this._current = d;
      }) // Store the initial angles
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return function (t) {
          return arcGenerator(interpolate(t));
        };
      });

    // Add labels with animation
    pieSvg
      .selectAll("text")
      .data(arcs)
      .enter()
      .append("text")
      .text(function (d) {
        return d.data.label + ": " + d.data.value + "%";
      })
      .attr("transform", function (d) {
        const [x, y] = arcGenerator.centroid(d);
        return `translate(${x},${y})`;
      })
      .style("text-anchor", "middle")
      .style("font-size", 11)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);
  }

  // Function to update the chart based on selected country
  function updateChart(selectedCountry) {
    // Filter data for the selected country
    const countryData = data
      .filter(
        (d) =>
          d.Country === selectedCountry &&
          d.Sex === "Total" &&
          d.AGE === "Y15T64"
      )
      .sort((a, b) => parseInt(a.TIME) - parseInt(b.TIME));
    const allGroup = ["EMP_WAP", "UNE_LF"];
    const dataReady = allGroup.map((grpName) => {
      return {
        name: grpName,
        values: countryData
          .filter((d) => d.MEASURE === grpName)
          .map((d) => ({
            time: d.TIME,
            value: d.Value,
            employeeType: grpName,
          })),
      };
    });

    // Clear previous chart
    svg.selectAll("*").remove();

    // Add X axis
    const x = d3
      .scaleBand()
      .domain(countryData.map((d) => d.TIME))
      .range([0, width])
      .padding(0.1);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    // Add Y axis
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

    // Color scale
    const myColor = d3
      .scaleOrdinal()
      .domain(["EMP_WAP", "UNE_LF"])
      .range(d3.schemeSet2);

    // Add the lines with animation
    const line = d3
      .line()
      .x((d) => x(d.time) + x.bandwidth() / 2)
      .y((d) => y(d.value));
    svg
      .selectAll("myLines")
      .data(dataReady)
      .join("path")
      .attr("d", (d) => line(d.values))
      .attr("stroke", (d) => myColor(d.name))
      .style("stroke-width", 4)
      .style("fill", "none")
      .attr("stroke-dasharray", function () {
        const totalLength = this.getTotalLength();
        return totalLength + " " + totalLength;
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength();
      })
      .transition()
      .duration(1000)
      .attr("stroke-dashoffset", 0);

    const mouseMove = function (event, d) {
      tooltip
        .html(
          `<strong>Year: ${d.time}</strong><br>${
            d.employeeType === "EMP_WAP" ? "Employment" : "Unemployment"
          }: ${d.value}%`
        )
        .style("left", `${event.layerX + 10}px`)
        .style("top", `${event.layerY}px`);
    };

    // Add the points with animation
    svg
      .selectAll("myDots")
      .data(dataReady)
      .join("g")
      .style("fill", (d) => myColor(d.name))
      .selectAll("myPoints")
      .data((d) => d.values)
      .join("circle")
      .attr("class", "dots")
      .attr("cx", (d) => x(d.time) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.value))
      .attr("r", 0) // Start with radius 0
      .attr("stroke", "white")
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseleave", mouseLeave)
      .on("click", function (event, d) {
        const year = d.time; // Assuming all values have the same year
        const employeeType = d.employeeType;
        updatePieChart(
          year,
          selectedCountry,
          employeeType === "EMP_WAP" ? "LREM" : "LRUN"
        );
        $(".pie-chart").fadeIn();
      })
      .transition()
      .duration(500)
      .attr("r", 5);

    // Add a legend at the end of each line
    svg
      .selectAll("myLabels")
      .data(dataReady)
      .join("g")
      .append("text")
      .datum((d) => {
        return { name: d.name, value: d.values[d.values.length - 1] };
      })
      .attr(
        "transform",
        (d) =>
          `translate(${x(d.value?.time) + x.bandwidth() / 2},${y(
            d.value.value
          )})`
      )
      .attr("x", 12)
      .text((d) => (d.name === "EMP_WAP" ? "Employment" : "Unemployment"))
      .style("fill", (d) => myColor(d.name))
      .style("font-size", 15)
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);

    // Add click event listener for dots
    // svg.selectAll(".dots").on("click", function (event, d) {
    //   const year = d.time; // Assuming all values have the same year
    //   const employeeType = d.employeeType;
    //   updatePieChart(
    //     year,
    //     selectedCountry,
    //     employeeType === "LREM64TT" ? "LREM" : "LRUN"
    //   );
    //   $(".pie-chart").fadeIn(); // Show pie chart container
    // });
  }

  // Update chart on country change
  countrySelect.change(function () {
    updateChart($(this).val());
    updatePieChart("2020", $(this).val(), "LREM");
  });

  updatePieChart("2020", defaultCountry, "LREM");

  // Initial chart render
  updateChart(defaultCountry);
}
