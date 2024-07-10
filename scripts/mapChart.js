function createMapChart(data) {
  const parentWidth = $("#mapwrapper").width();
  const width = parentWidth;
  const height = 600;

  // Define the zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) // Limit zoom scale
    .on("zoom", zoomed);

  // The svg
  const svgMap = d3
    .select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  // Map and projection
  const projection = d3
    .geoNaturalEarth1()
    .scale(200)
    // .scale(widthMap / 1.3 / Math.PI)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Zoom function
  function zoomed(event) {
    const { transform } = event;
    svgMap.selectAll("path").attr("transform", transform);

    svgMap.selectAll("circle").attr("transform", transform);
  }

  const tooltip = d3
    .select("#map-container")
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

  // Load external data and boot
  d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  ).then(function (world) {
    const latestData = data.reduce((acc, d) => {
      if (
        !acc[d.iso_code] ||
        new Date(d.date) > new Date(acc[d.iso_code].date)
      ) {
        acc[d.iso_code] = d;
      }
      return acc;
    }, {});

    // Map data to country ISO codes
    const dataById = {};
    for (const key in latestData) {
      dataById[key] = {
        total_cases: +latestData[key].total_cases,
        total_deaths: +latestData[key].total_deaths,
        date: latestData[key].date,
      };
    }

    // Draw the map
    svgMap
      .append("g")
      .selectAll("path")
      .data(world.features)
      .join("path")
      .attr("fill", "#cccccc")
      // .attr("d", path)
      .attr("d", path)
      .style("stroke", "#fff");

    function updateCircles(metric) {
      const mouseMove = function (event, d) {
        const data = dataById[d.id];
        tooltip
          .html(
            `<strong>${data.date}</strong><br>${d.properties.name}: ${data[
              metric
            ].toLocaleString()}`
          )
          .style("left", `${event.layerX + 10}px`)
          .style("top", `${event.layerY}px`);
      };
      svgMap
        .selectAll("circle")
        .data(world.features)
        .join("circle")
        .attr("class", "dots")
        .attr("cx", (d) => {
          const centroid = path.centroid(d);
          return centroid[0];
        })
        .attr("cy", (d) => {
          const centroid = path.centroid(d);
          return centroid[1];
        })
        .attr("r", (d) => {
          const data = dataById[d.id] || { total_cases: 0, total_deaths: 0 };
          return (
            Math.sqrt(data[metric]) * (metric === "total_cases" ? 0.001 : 0.01)
          );
        })
        .attr(
          "fill",
          metric === "total_cases" ? "#1f77b4" : "rgba(214, 39, 40,1)"
        )
        .attr("opacity", 0.6)
        .on("mouseover", mouseOver)
        .on("mousemove", mouseMove)
        .on("mouseleave", mouseLeave);
    }

    updateCircles("total_cases");

    $("#cta-map-total-case").on("click", function () {
      updateCircles("total_cases");
      $("#cta-map-total-death").removeClass("active");
      $(this).addClass("active");
    });

    $("#cta-map-total-death").on("click", function () {
      updateCircles("total_deaths");
      $("#cta-map-total-case").removeClass("active");
      $(this).addClass("active");
    });

    renderList(world, dataById, "", path, width, height, svgMap, zoom);
    $("#search-input").on("input", function () {
      const filter = $(this).val();
      renderList(world, dataById, filter, path, width, height, svgMap, zoom);
      // console.log(filter);
    });
  });
}

function renderList(
  world,
  dataById,
  filter = "",
  path,
  width,
  height,
  svgMap,
  zoom
) {
  // Clear previous content
  $("#list-group-map").empty();

  // Filter the world features based on the search input
  const filteredFeatures = filter
    ? world.features.filter((d) =>
        d.properties.name.toLowerCase().includes(filter.toLowerCase())
      )
    : world.features;

  // Append filtered features to the list
  filteredFeatures.forEach(function (d) {
    const data = dataById[d.id] || { total_cases: 0, total_deaths: 0 };
    const countryName = d.properties.name;
    // <small>Last updated just now.</small>

    const listItem = $(`
      <a href="#" class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-2">${countryName}</h5>
          <small>${data.date ? "Date: " + data.date : ""}</small>
        </div>
        <p class="mb-1">Cases: ${data.total_cases}, Deaths: ${
      data.total_deaths
    }</p>
      </a>
    `);

    listItem.on("click", function (event) {
      event.preventDefault();
      // Zoom effect: Adjust the scale and translate
      const bounds = path.bounds(d);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const x = (bounds[0][0] + bounds[1][0]) / 2;
      const y = (bounds[0][1] + bounds[1][1]) / 2;
      const scale = Math.max(
        1,
        Math.min(8, 0.9 / Math.max(dx / width, dy / height))
      );
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      // Apply the zoom transform
      svgMap
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    });

    $("#list-group-map").append(listItem);
  });
}

function MapChart(data) {
  d3.select("#map-container").selectAll("*").remove();

  createMapChart(data);
}
