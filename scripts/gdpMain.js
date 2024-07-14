let employeeData = [];
let unemployeeData = [];
let gdpData = [];
let dataLoaded = false;
$('#loader').show();

let covidData = [];

const loadData = async () => {
  try {
    covidData = await d3.csv("data/owid-covid-data.csv", (d) => {
      const parseTime = d3.timeParse("%Y-%m-%d");
      const parseDate = parseTime(d.date);
      const timeFormatYear = d3.timeFormat("%Y");
      return {
        ...d,
        gdp_per_capita: +d.gdp_per_capita,
        total_cases_per_million: +d.total_cases_per_million,
        total_cases: +d.total_cases,
        total_deaths: +d.total_deaths,
        total_deaths_per_million: +d.total_deaths_per_million,
        total_vaccinations: +d.total_vaccinations,
        stringency_index: +d.stringency_index,
        handwashing_facilities: +d.handwashing_facilities,
        year: timeFormatYear(parseDate),
      };
    });
    dataLoaded = true;
    // console.log("Data loaded successfully:", covidData);
    $(document).trigger("dataLoaded"); // Trigger an event when data is loaded
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

const loadDataEmpolyee = async () => {
  try {
    // employeeData = await d3.csv("data/STLABOUR_13062024193125895.csv", (d) => {
    employeeData = await d3.csv("data/empolyee.csv", (d) => {
      return {
        ...d,
        Value: d.OBS_VALUE,
        Country: d["Reference area"],
        TIME: d.TIME_PERIOD,
        SUBJECT: d.Sex,
      };
    });
    dataLoaded = true;
    // console.log("Data loaded successfully:", employeeData);
    $(document).trigger("dataLoadedEmpolyee"); // Trigger an event when data is loaded
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

const loadDataUnEmpolyee = async () => {
  try {
    // employeeData = await d3.csv("data/STLABOUR_13062024193125895.csv", (d) => {
    unemployeeData = await d3.csv("data/unempolyee.csv", (d) => {
      return {
        ...d,
        Value: d.OBS_VALUE,
        Country: d["Reference area"],
        TIME: d.TIME_PERIOD,
        SUBJECT: d.Sex,
      };
    });
    dataLoaded = true;
    // console.log("Data loaded successfully:", unemployeeData);
    $(document).trigger("dataLoadedEmpolyee"); // Trigger an event when data is loaded
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

const loadDataGDP = async () => {
  try {
    // employeeData = await d3.csv("data/STLABOUR_13062024193125895.csv", (d) => {
    gdpData = await d3.csv("data/GDP.csv", (d) => {
      return {
        ...d,
        code: d["Country Code"],
        location: d["Country Name"],
      };
    });
    dataLoaded = true;
    // console.log("Data loaded successfully:", unemployeeData);
    $(document).trigger("dataLoadedEmpolyee"); // Trigger an event when data is loaded
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

$(document).ready(async function () {
  // Load data when the document is ready
  await loadDataEmpolyee();
  await loadDataUnEmpolyee();
  await loadData();
  await loadDataGDP();
  $('#loader').hide();
  // console.log(gdpData);
  const data = [...employeeData, ...unemployeeData];
  BarLineChart(covidData, gdpData, "United States");
  EmployeeLinePieChart(data);
  EmpolyeeAllAgeLineChart(data, "United States");
});
