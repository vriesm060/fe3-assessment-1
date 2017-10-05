
// Source: https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172

// Select the SVG:
var svg = d3.select('svg');

// Define the margins of the chart:
var margin = {
  left: 50,
  right: 50,
  top: 25,
  bottom: 100
};

// Define the width of the chart:
var width = screen.width - margin.left;
// Define the height of the focused area:
var heightFocus = (width * 0.3);
// Define the height of the context area:
var heightContext = 50;

// Make sure the context area sticks to the bottom of the focused area of the chart:
var marginTopContext = heightFocus + heightContext;

// Define the time format (YYYYMMDD):
var parseDate = d3.timeParse('%Y%m%d');

// Create a linear scale for time with a range between 0 and the width of the chart:
var xFocus = d3.scaleTime().range([0, width - margin.right]);
// Create a linear scale for the temperature with a range between the height of the focused area of the chart and 0:
var yFocus = d3.scaleLinear().range([heightFocus, 0]);

// Do the same like lines 29 and 31 for the context area of the chart:
var xContext = d3.scaleTime().range([0, width - margin.right]);
var yContext = d3.scaleLinear().range([heightContext, 0]);

// Create the x and y axis for the focused and context areas of the chart:
var xAxis = d3.axisBottom(xFocus);
var yAxisFocus = d3.axisLeft(yFocus);
var yAxisContext = d3.axisLeft(yContext);

// Create the highlight to show the region you're zooming onto:
var brush = d3.brushX()
  .extent([[0, 0], [width, heightContext]])
  .on('brush end', brushed);

// Create the zoom effect:
var zoom = d3.zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([[0, 0], [width, heightFocus]])
  .extent([[0, 0], [width, heightFocus]])
  .on('zoom', zoomed);

// Create the line to be drawn into the focused area:
var lineFocus = d3.line()
  .x(function (d) { return xFocus(d.date); })
  .y(function (d) { return yFocus(d.temp); });

// Create the line to be drawn into the context area:
var lineContext = d3.line()
  .x(function (d) { return xContext(d.date); })
  .y(function (d) { return yContext(d.temp); });

// Draw a clippath over the SVG to mask the focused area of the chart, so it doesn't overflow:
svg.append('defs')
  .append('clipPath')
  .attr('id', 'clip')
  .append('rect')
  .attr('width', width)
  .attr('height', heightFocus);

// Draw the focused area:
var focus = svg.append('g')
  .attr('class', 'focus')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw the context area:
var context = svg.append('g')
  .attr('class', 'context')
  .attr('transform', 'translate(' + margin.left + ',' + marginTopContext + ')');

// Load in the data of the CSV file:
d3.csv('index.csv', type, function(error, data) {
  if (error) throw error;

  // Map the domains to the x and y ranges:
  xFocus.domain(d3.extent(data, function(d) { return d.date; }));
  yFocus.domain([d3.min(data, function(d) { return d.temp; }), d3.max(data, function(d) { return d.temp; })]);
  xContext.domain(xFocus.domain());
  yContext.domain(yFocus.domain());

  // Draw the line of data into the focused area:
  focus.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', lineFocus);

  // Draw the x-axis of the focused area:
  focus.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + (heightFocus - 97.5) + ')')
      .call(xAxis);

  // Draw the y-axis of the focused area and add the text 'Temperature' to it:
  focus.append('g')
      .attr('class', 'axis axis--y')
      .call(yAxisFocus)
      .append('text')
      .attr('fill', '#000')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.75em')
      .attr('text-anchor', 'end')
      .text('Temperature');

  // Draw the line of data into the context area:
  context.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('d', lineContext);

  // Draw the x-axis of the context area:
  context.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + heightContext + ')')
      .call(xAxis);

  // Draw the hightlight:
  context.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, xContext.range());

  // Add the zoomed effect to the SVG:
  svg.append('rect')
      .attr('class', 'zoom')
      .attr('width', width)
      .attr('height', heightFocus)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .call(zoom);
});

// Change the width and position of the hightlight when zooming and dragging:
function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
  var s = d3.event.selection || xContext.range();
  xFocus.domain(s.map(xContext.invert, xContext));
  focus.select('.line').attr('d', lineFocus);
  focus.select('.axis--x').call(xAxis);
  svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

// Rescale the focused area of the chart when zooming:
function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
  var t = d3.event.transform;
  xFocus.domain(t.rescaleX(xContext).domain());
  focus.select('.line').attr('d', lineFocus);
  focus.select('.axis--x').call(xAxis);
  context.select('.brush').call(brush.move, xFocus.range().map(t.invertX, t));
}

// Set the loaded in data to the correct type and return it:
function type(d) {
  d.date = parseDate(d.date);
  d.temp = +d.temp;
  return d;
}