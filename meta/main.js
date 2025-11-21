import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const totalLines = d3.sum(lines, (d) => {
        if (d.added !== undefined && d.removed !== undefined) {
          return Number(d.added) + Number(d.removed);
        }
        if (d.line !== undefined) return Number(d.line);
        if (d.length !== undefined) return Number(d.length);
        return 1;
      });

      const ret = {
        id: commit,
        url: "https://github.com/vichen1/portfolio/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false,
      });

      return ret;
    });
}


function renderCommitInfo(data, commits) {
  const dl = d3.select(".stats-grid");

  const numFiles = d3.group(data, (d) => d.file).size;
  const totalLOC = data.length;
  const maxDepth = d3.max(data, (d) => d.depth);
  const longestLine = d3.max(data, (d) => d.length);
  const maxLines = d3.max(commits, (d) => d.totalLines);

  const stats = [
    { label: "Commits", value: commits.length },
    { label: "Files", value: numFiles },
    { label: "Total LOC", value: totalLOC },
    { label: "Max Depth", value: maxDepth },
    { label: "Longest Line", value: longestLine },
    { label: "Max Lines", value: maxLines },
  ];

  const items = dl.selectAll("div")
    .data(stats)
    .join("div");

  items.append("dt").text((d) => d.label);
  items.append("dd").text((d) => d.value);
}


function createBrushSelector(svg) {
  const brush = d3.brush()
    .on("start brush end", brushed);

  svg.call(brush);
  svg.selectAll(".dots, .overlay ~ *").raise();
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll("circle").classed("selected", (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector("#selection-count");
  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }

  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type || "Unknown"
  );

  container.innerHTML = "";

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1%")(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 50 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // Scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  const dots = svg.append("g").attr("class", "dots");

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll("circle")
    .data(sortedCommits, d => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", d => {
      const r = rScale(d.totalLines);
      return r;
    })
    .style("--r", d => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", updateTooltipPosition)
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .attr("class", "x-axis")
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .attr("class", "y-axis")
    .call(yAxis);

  createBrushSelector(svg);
}


let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);

let filteredCommits = commits;

let commitProgress = 100;

const timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

function onTimeSliderChange() {
  commitProgress = +document.getElementById("commit-progress").value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById("commit-time").textContent = commitMaxTime.toLocaleString(
    "en-US",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  );

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

document
  .getElementById("commit-progress")
  .addEventListener("input", onTimeSliderChange);


renderScatterPlot(data, commits);
onTimeSliderChange();
updateFileDisplay(filteredCommits);

function renderTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");

  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");

  const offsetX = 15;
  const offsetY = 15;

  tooltip.style.left = `${event.clientX + offsetX}px`;
  tooltip.style.top = `${event.clientY + offsetY}px`;
}

function updateTooltipVisibility(show) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.classList.toggle("visible", show);
  tooltip.classList.toggle("hidden", !show);
}


function updateScatterPlot(data, commits) {
  const svg = d3.select("#chart").select("svg");

  xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxisGroup = svg.select("g.x-axis");
  xAxisGroup.selectAll("*").remove();
  xAxisGroup.call(d3.axisBottom(xScale));

  const dots = svg.select("g.dots");
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll("circle")
    .data(sortedCommits, d => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", d => {
      const r = rScale(d.totalLines);
      return r;
    })
    .style("--r", d => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove", updateTooltipPosition)
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}
function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);

  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(enter => {
      const div = enter.append('div');
      div.append('dt');
      div.append('dd');
      return div;
    });

  filesContainer.select('dt').html(d =>
    `<code>${d.name}</code><small>${d.lines.length} lines</small>`
  );

  filesContainer
  .select('dd')
  .selectAll('div')
  .data(d => d.lines)
  .join('div')
  .attr('class', 'loc')
  .attr('style', d => `--color: ${colors(d.type)}`);
}
const stepCommits = commits.filter(d => d.totalLines > 50);

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(d => `
      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })},
        I made <a href="${d.url}" target="_blank">
        ${d.totalLines > 10 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>.
      </p>

      <p>
        I edited ${d.totalLines} lines across ${
          d3.rollups(
            d.lines,
            D => D.length,
            d => d.file,
          ).length
        } files.
      </p>

      <p>Then I looked over all I had made, and I saw that it was very good.</p>
  `);


function onStepEnter(response) {
  const commit = response.element.__data__;

  console.log("Scrolled to commit:", commit.datetime);

  const cutoff = commit.datetime;

  const filtered = commits.filter(d => d.datetime <= cutoff);

  updateScatterPlot(data, filtered);   
  updateFileDisplay(filtered);       
  updateSummaryStats(filtered);   
}

const scroller = scrollama();

scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5,   
  })
  .onStepEnter(onStepEnter);



