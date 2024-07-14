function BarLineChart(data, gdpData, selectedCountry) {
  const parentWidth = $("#cardWidth").width();
  const margin = { left: 70, top: 20, right: 20, bottom: 60 };

  const width = parentWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#groupbar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // x label
  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("font-size", "16px")
    .attr("text-anchor", "middle")
    .text("Years");

  // y label
  g.append("text")
    .attr("class", "y axis-label")
    .attr("x", -(height / 2))
    .attr("y", -50)
    .attr("font-size", "16px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Cases and Deaths Count");

  const y2Label = g.append("text")
    .attr("class", "y axis-label")
    .attr("font-size", "16px")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${width+ 6}, ${height / 2})rotate(90)`)
    // .text(
    //   `${
    //     $("input[name='inlinecheckfield']:checked").val() === "gdp_growth"
    //       ? "GDP Rate"
    //       : $("input[name='inlinecheckfield']:checked").val() ===
    //         "stringency_index"
    //       ? "Stringency"
    //       : "Handwashing Facilities"
    //   } Count`
    // );

  const x = d3
    .scaleBand()
    .range([0, width - margin.right])
    .paddingInner(0.1)
    .paddingOuter(0.05);

  const y = d3.scaleLog().range([height, 0]);

  const y2 = d3.scaleLinear().range([height, 0]);

  const xaxisGroup = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);

  const yaxisGroup = g.append("g").attr("class", "y axis");

  const y2axisGroup = g
    .append("g")
    .attr("class", "y2 axis")
    .attr("transform", `translate(${width - margin.right},0)`);

  // Create a tooltip
  var tooltip = d3
    .select("#groupbar-chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  // Format the date
  const formatDate = d3.timeFormat("%Y");

  $("#allLocationDropdown").change(function () {
    update(
      data,
      $(this).val(),
      $("input[name='inlinecheckfield']:checked").val()
    );
  });

  $("input[name='inlinecheckfield']").change(function () {
    const selectedGroup = $(this).val();
    update(data, $("#allLocationDropdown").val(), selectedGroup);
  });

  update(data, selectedCountry, "gdp_growth");

  function update(oData, selectedCountry, selectedGroup) {
    
    const filteredData = oData
    .filter((d) => d.location === selectedCountry)
    .reduce((acc, curr) => {
      const year = curr.year;
      if (!acc[year] || new Date(curr.date) > new Date(acc[year].date)) {
        acc[year] = curr;
      }
      return acc;
    }, {});
    
    const filterGDPData = gdpData.filter((d) => d.location === selectedCountry);
    
    const dataMap = Object.values(filteredData).map(
      ({
        year,
        total_deaths,
        total_cases,
        stringency_index,
        // handwashing_facilities,
      }) => ({
        year,
        total_deaths,
        total_cases,
        stringency_index,
        // handwashing_facilities,
      }));
    
    // const years = selectedGroup === "gdp_growth"? d3.range(2015, 2025).map((d) => d.toString()): dataMap.map(d => d.year);
    const years = d3.range(2015, 2025).map((d) => d.toString())
    const data = years.map((year) => {
      const record = dataMap.find((d) => d.year === year) || {};
      return {
        year,
        total_deaths: record.total_deaths || 0,
        total_cases: record.total_cases || 0,
        stringency_index: record.stringency_index || null,
        // handwashing_facilities: record.handwashing_facilities || 0,
        gdp_growth: parseFloat(filterGDPData[0][`${year} [YR${year}]`]) || null,
      };
    });

    const subgroups = ["total_cases", "total_deaths"];

    x.domain(data.map((d) => d.year));
    y.domain([1, d3.max(data, (d) => Math.max(d.total_cases, d.total_deaths))]);
    y2.domain(d3.extent(data, (d) => d[selectedGroup]));

    const xSubgroup = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .paddingInner(0.2)
      .paddingOuter(0);

    const t = d3.transition().duration(500);
    const tc = d3.transition().duration(750);

    const xAxisCall = d3.axisBottom(x);
    xaxisGroup.transition(t).call(xAxisCall);

    const yAxisCall = d3.axisLeft(y).ticks(6).tickFormat(d3.format(",.0f"));
    yaxisGroup.transition(t).call(yAxisCall);

    const y2AxisCall = d3.axisRight(y2).ticks(6);
    y2axisGroup.transition(t).call(y2AxisCall);

    const mouseover = function (event, d) {
      tooltip
        .html(
          `<b>Key</b>: ${d.key}<br/> <b>Value</b>: ${d.value.toLocaleString()}`
        )
        .style("opacity", 1);
    };

    const mousemove = function (event, d) {
      tooltip
        .style("transform", "translateY(-55%)")
        .style("left", event.layerX + 10 + "px")
        .style("top", event.layerY + 50 + "px");
    };

    const mouseleave = function (event, d) {
      tooltip.style("opacity", 0);
    };

    const color = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#17becf", "#d62719"]);

    var rows = g.selectAll(".main").data(data);
    rows.exit().transition(t).remove();
    rows = rows
      .enter()
      .append("g")
      .merge(rows)
      .attr("class", (d) => `main ${d.year}`)
      .attr("transform", (d) => `translate(${x(d.year)}, 0)`);

    var rects = rows.selectAll(".rect").data((d) => {
      return subgroups.map(function (key) {
        return { key: key, value: d[key] };
      });
    });
    rects.exit().transition(t).remove();
    rects = rects.enter().append("rect").merge(rects);

    rects
      .datum((d) => d)
      .attr("class", (d) => `rect ${d.key.replace(/\s/g, "")}`)
      .attr("x", (d) => xSubgroup(d.key))
      .attr("width", xSubgroup.bandwidth())
      .attr("fill", (d) => color(d.key))
      .attr("height", 0)
      .attr("y", y(1))
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .transition(t)
      .attr("y", (d) => d.value > 0 ? y(d.value) : y(1))
      .attr("height", (d) => d.value > 0 ? height - y(d.value) : 0);

    const filteredLineData = data.filter(d => d[selectedGroup] !== null)

    const line = d3
      .line()
      .x((d) => x(d.year) + x.bandwidth() / 2)
      .y((d) => y2(d[selectedGroup]));

    const path = g.selectAll(".path").data([filteredLineData]);
    path.exit().remove();
    path.transition(tc).attr("d", line);
    path
      .enter()
      .append("path")
      .attr("class", "path")
      .attr("fill", "none")
      .attr("stroke", "#2c982c")
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 3)
      .attr("d", line)
      // .transition(tc);

    const mouseoverCircle = function (event, d) {
      tooltip
        .html(`<b>Year</b>: ${d.year}<br/> <b>${$("input[name='inlinecheckfield']:checked").val() === "gdp_growth" ? "GDP Rate": "Government Saftey Measures"}</b>: ${d[selectedGroup]}`)
        .style("opacity", 1);
    };

    const circles = g.selectAll(".dots").data(filteredLineData);
    circles.exit().remove();
    circles
      .transition(tc)
      .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
      .attr("cy", (d) => y2(d[selectedGroup]));
    circles
      .enter()
      .append("circle")
      .attr("class", "dots")
      .attr("fill", "#2c982c")
      .attr("r", 5)
      .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
      .attr("cy", (d) => y2(d[selectedGroup]))
      // .merge(circles)
      .on("mouseover", mouseoverCircle)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      // .transition(tc)
      // .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
      // .attr("cy", (d) => y2(d[selectedGroup]));

      y2Label.text(`${
        selectedGroup === "gdp_growth"
          ? "GDP Rate"
          : "Government Saftey Measures"  
      }`)
  }
}
