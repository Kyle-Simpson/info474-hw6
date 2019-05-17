'use strict';
/*
1. make a filterByYear function
*/

'use strict';

(function () {
  let data = "no data";
  let allYearsData = "no data";
  let svgLinePlot = ""; // keep SVG reference in global scope
  let svgScatterGraph = "";

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgLinePlot = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    svgScatterGraph = d3.select("body")
      .append('svg')
      .attr('width', 250)
      .attr('height', 250)
      .attr('id', 'line');
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;
        makeLinePlot(data);
      });
  }

  // make scatter plot with trend line
  function makeLinePlot(csvData) {
    data = csvData // assign data as global variable

    const dropdownData = Array.from(new Set(data.map(s => s["location"])))
      .map(location => {
        return {
          location: data.find(s => s["location"] === location)["location"]
        }
      })

    var dropDown = d3.select('body').append('select')
      .attr('name', 'country-list')
    var options = dropDown.selectAll('option')
      .data(dropdownData)
      .enter()
      .append('option')
    options.text(function (d) { return d.location })
      .attr('value', function (d) { return d.location })

    var data_by_year = data.filter(s => s["location"] == "AUS")

    dropDown.on("change", function () {
      var selected = this.value;
      data_by_year = csvData.filter(s => s["location"] == selected)
      svgLinePlot.selectAll("*").remove()

      let fertility_rate_data = data_by_year.map((row) => parseFloat(row["time"]));
      let life_expectancy_data = data_by_year.map((row) => parseFloat(row["pop_mlns"]));

      // find data limits
      let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

      // draw axes and return scaling + mapping functions
      let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns", svgLinePlot, {min: 50, max: 450}, {min: 50, max: 450});

      // plot data as points and add tooltip functionality
      plotData(mapFunctions, data_by_year);

      // draw title and axes labels
      makeLabels();
    })
    data = data_by_year

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["time"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["pop_mlns"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns", svgLinePlot, {min: 50, max: 450}, {min: 50, max: 450});

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, data);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgLinePlot.append('text')
      .attr('x', 50)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Population Size (in millions) over Time by Country");

    svgLinePlot.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLinePlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population Size (millions)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, dataToUse) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // Tooltip scatterplot
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .attr('id', 'tooltip')
      .style("opacity", 0);

    div.append("svg")
      .attr('width', 250)
      .attr('height', 250)

    const tooltip = document.getElementById('tooltip');
    const scatterGraph = document.getElementById('line');

    // Line Graph
    let line = d3.line()
      .x((d) => xMap(d))
      .y((d) => yMap(d));

    svgLinePlot.append('path')
      .datum(dataToUse)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        tooltip.appendChild(scatterGraph);
        makeScatterGraph(d[0]["location"]);
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
          tooltip.removeChild(tooltip.firstChild)
      });
  }



  function makeScatterGraph(country) {
    svgScatterGraph.html("");
    let countryData = allYearsData.filter((row) => row["location"] == country);
    let fertilityRates = countryData.map((row) => row["fertility_rate"]);
    let lifeExpectancies = countryData.map((row) => row["life_expectancy"]);

    let minMax = findMinMax(fertilityRates, lifeExpectancies);

  

    svgScatterGraph.append('text')
      .attr('x', 90)
      .attr('y', 210)
      .style('font-size', '6pt')
      .text('Fertility Rate');

    svgScatterGraph.append('text')
      .attr('x', 90)
      .attr('y', 15)
      .style('font-size', '6pt')
      .text(country);

    svgScatterGraph.append('text')
      .attr('transform', 'translate(6, 150)rotate(-90)')
      .style('font-size', '6pt')
      .text('Life Expectancy (years)');


    let funcs = drawAxes(minMax, "fertility_rate", "life_expectancy", svgScatterGraph, {min: 30, max: 185}, {min: 30, max: 185});
    plotScatterGraph(funcs, countryData, country);
  }

  function plotScatterGraph(funcs, countryData) {
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([1, 5]);
    

    // mapping functions
    let xMap = funcs.x;
    let yMap = funcs.y;


    // append data to SVG and plot as points
    svgScatterGraph.selectAll('.dot')
      .data(countryData)
      .enter()
      .append('circle')
      .attr('cx', d => xMap(d))
      .attr('cy', d => yMap(d))
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .attr('fill', "#4286f4")

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();