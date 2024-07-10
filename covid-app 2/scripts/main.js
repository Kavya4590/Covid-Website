let covidData = [];
let dataLoaded = false;

const loadData = async () => {
  try {
    covidData = await d3.csv("data/owid-covid-data.csv", (d) => {
      return {
        ...d,
        continent: d.continent,
        location: d.location,
        date: d.date,
        total_cases: +d.total_cases,
        total_deaths: +d.total_deaths,
        total_vaccinations: +d.total_vaccinations,
        hosp_patients: +d.hosp_patients,
        gdp_per_capita: +d.gdp_per_capita,
      };
    });
    dataLoaded = true;
    // console.log("Data loaded successfully:", covidData);
    $(document).trigger("dataLoaded"); // Trigger an event when data is loaded
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

const getCovidData = () => {
  if (!dataLoaded) {
    throw new Error("Data not loaded yet. Call loadData() first.");
  }
  return covidData;
};

function getUniqueValuesByKey(data, keyName) {
  const uniqueValues = data.reduce((acc, record) => {
    const value = record[keyName];
    if (value && !acc.includes(value)) {
      acc.push(value);
    }
    return acc;
  }, []);

  return uniqueValues.map((value, index) => ({
    name: value,
    key: index + 1,
  }));
}

function appendOptionsToDropdown(uniqueValues, selectElementId) {
  const selectDropdown = $("#" + selectElementId);

  uniqueValues.forEach((value) => {
    selectDropdown.append(
      $("<option>", {
        value: value.name,
        text: value.name,
      })
    );
  });
}

function populateLocationsForContinent(selectedContinent) {
  const filteredLocations = covidData
    .filter((record) => record.continent === selectedContinent)
    .map((record) => record.location);
  const uniqueLocations = [...new Set(filteredLocations)];
  const locationDropdown = $("#locationDropdown");
  locationDropdown.empty(); // Clear existing options

  // Add default location for the United States
  // const defaultLocation = "United States";
  // // if (!uniqueLocations.includes(defaultLocation)) {
  // //   uniqueLocations.unshift(defaultLocation); // Add default location to the beginning
  // // }

  // Add default option
  locationDropdown.append(
    $("<option>", {
      value: "",
      text: "-- Select Location --",
    })
  );

  // Add options for filtered locations
  uniqueLocations.forEach((location) => {
    locationDropdown.append(
      $("<option>", {
        value: location,
        text: location,
      })
    );
  });
}

// Function to filter data based on continent
function filterDataByContinent(data, continent) {
  return data.filter((record) => record.continent === continent);
}

// Function to filter data based on location
function filterDataByLocation(data, location) {
  return data.filter((record) => record.location === location);
}

// Function to filter data based on time period
function filterDataByTimePeriod(data, startDate, endDate) {
  const startDateString = startDate.toISOString().split("T")[0];
  const endDateString = endDate.toISOString().split("T")[0];

  return data.filter((record) => {
    const recordDate = record.date.split("T")[0];
    return recordDate >= startDateString && recordDate <= endDateString;
  });
}

// Function to get start and end dates based on time period
function getStartAndEndDates(timePeriod, customStartDate, customEndDate) {
  const currentDate = new Date();
  let startDate, endDate;

  switch (timePeriod) {
    case "last30days":
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - 30
      );
      endDate = currentDate;
      break;
    case "last15days":
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - 15
      );
      endDate = currentDate;
      break;
    case "last7days":
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - 7
      );
      endDate = currentDate;
      break;
    case "lastMonth":
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      break;
    case "custom":
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        throw new Error(
          "For custom time period, both customStartDate and customEndDate must be provided."
        );
      }
      break;
    case "all-time":
      startDate = new Date(0);
      endDate = currentDate;
      break;
    default: // For specific year
      startDate = new Date(timePeriod, 0, 1);
      endDate = new Date(timePeriod, 11, 31);
      break;
  }

  return {
    startDate,
    endDate,
    daysBetween: getDaysBetween(startDate, endDate),
  };
}

function getDaysBetween(startDate, endDate) {
  const oneDay = 24 * 60 * 60 * 1000; // Hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay));
  return diffDays;
}

// Function to calculate latest values of new cases, deaths, and hospitalized
function calculateLatestValues(data) {
  const latestData = data[data.length - 1] || {}; // Handling case where data array might be empty
  return {
    totalCases:
      latestData.total_cases !== undefined
        ? latestData.total_cases.toLocaleString()
        : 0,
    deaths:
      latestData.total_deaths !== undefined
        ? latestData.total_deaths.toLocaleString()
        : 0,
    vaccinations:
      latestData.total_vaccinations !== undefined
        ? latestData.total_vaccinations.toLocaleString()
        : 0,
    hospitalized:
      latestData.hosp_patients !== undefined
        ? latestData.hosp_patients.toLocaleString()
        : 0,
  };
}

function filterData(data, continent, location, startDate, endDate) {
  return data.filter((record) => {
    // Filter by continent, location, and date range
    return (
      (!continent || record.continent === continent) &&
      (!location || record.location === location) &&
      new Date(record.date) >= startDate &&
      new Date(record.date) <= endDate
    );
  });
}

$(document).ready(async function () {
  // Load data when the document is ready
  await loadData();

  // // You can now use the data when the document is ready
  // $(document).on("dataLoaded", function () {
  //   const data = getCovidData();
  //   console.log("Accessing covidData in main.js:", data);
  // });

  const uniqueContinents = getUniqueValuesByKey(covidData, "continent");
  appendOptionsToDropdown(uniqueContinents, "continentDropdown");

  populateLocationsForContinent("North America");
  $("#continentDropdown").val("North America");
  $("#locationDropdown").val("United States");
  $("#timePeriodDropdown").val("all-time");

  $("#continentDropdown").change(function () {
    const selectedContinent = $(this).val();
    if (selectedContinent) {
      populateLocationsForContinent(selectedContinent);
    } else {
      $("#locationDropdown").empty(); // Clear location dropdown if no continent selected
    }
  });

  $("#locationDropdown").change(updateLatestValues);
  $("#timePeriodDropdown").change(() => {
    cusStartDate = "";
    cusEndDate = "";
    cusTimePeriod = "";
    updateLatestValues();
  });

  let cusStartDate,
    cusEndDate,
    cusTimePeriod = "";

  $("#dateRange").daterangepicker(
    { showDropdowns: false, minYear: 2020, maxYear: 2024 },
    function (start, end) {
      cusStartDate = start.format("MM-DD-YYYY");
      cusEndDate = end.format("MM-DD-YYYY");
      cusTimePeriod = "custom";
      updateLatestValues();
    }
  );

  $("#lineChartWrapper").css("display", "none");
  $("#chartSwitch").change(() => {
    const currentElement = $("#chartSwitch");
    if (currentElement.is(":checked")) {
      $("#barChartWrapper").css("display", "none");
      $("#lineChartWrapper").css("display", "block");
    } else {
      $("#barChartWrapper").css("display", "block");
      $("#lineChartWrapper").css("display", "none");
    }
  });
  $(".dateRange").hide();
  $('input[type="radio"]').click(function () {
    var inputValue = $(this).attr("value");
    var targetBox = $("." + inputValue);
    $(".box").not(targetBox).hide();
    $(targetBox).show();
  });

  // Update latest values when dropdowns change
  function updateLatestValues() {
    const selectedContinent = $("#continentDropdown").val();
    const selectedLocation = $("#locationDropdown").val();
    const timePeriod = $("#timePeriodDropdown").val();

    const filteredData = filterDataByContinent(covidData, selectedContinent);
    const filteredDataByLocation = filterDataByLocation(
      filteredData,
      selectedLocation
    );
    const { startDate, endDate, daysBetween } = getStartAndEndDates(
      cusTimePeriod === "custom" ? cusTimePeriod : timePeriod,
      cusStartDate,
      cusEndDate
    );
    const filteredDataByTimePeriod = filterDataByTimePeriod(
      filteredDataByLocation,
      startDate,
      endDate
    );

    const latestValues = calculateLatestValues(filteredDataByTimePeriod);

    // Update UI with latest values
    $("#totalCases").text(latestValues.totalCases);
    $("#deaths").text(latestValues.deaths);
    $("#vaccinated").text(latestValues.vaccinations);
    $("#hospitalized").text(latestValues.hospitalized);

    $("#filteredForm").text(
      '" Filtered Data: ' +
        selectedContinent +
        " - " +
        selectedLocation +
        " - " +
        (cusTimePeriod === "custom"
          ? cusStartDate + " to " + cusEndDate
          : timePeriod) +
        ' "'
    );

    const filterChartData = filterData(
      covidData,
      selectedContinent,
      selectedLocation,
      startDate,
      endDate
    );

    const filterMapChartData = filterData(
      covidData,
      null,
      null,
      startDate,
      endDate
    );

    $("#cases-checkbox").on("change", () =>
      LineChart(filterChartData, daysBetween)
    );
    $("#deaths-checkbox").on("change", () =>
      LineChart(filterChartData, daysBetween)
    );
    $("#vaccinations-checkbox").on("change", () =>
      LineChart(filterChartData, daysBetween)
    );
    $("#hospitalized-checkbox").on("change", () =>
      LineChart(filterChartData, daysBetween)
    );

    BarChart(filterChartData, daysBetween);
    LineChart(filterChartData, daysBetween);
    MapChart(filterMapChartData);

    window.addEventListener("resize", () => {
      BarChart(filterChartData, daysBetween);
      LineChart(filterChartData, daysBetween);
    });
  }

  // Initial update of latest values
  updateLatestValues();
});

export { getCovidData };
