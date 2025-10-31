import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let selectedIndex = -1;  // which wedge is selected (-1 = none)
let query = '';           // search text
let chartData = [];       // store current chart data globally for filtering

/* ---------- helper ---------- */
function renderProjectsAndTitle(list, extra = '') {
  projectsContainer.innerHTML = '';
  renderProjects(list, projectsContainer, 'h2');
  titleElement.textContent = `${list.length} Projects${extra}`;
}

/* ---------- chart ---------- */
function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  chartData = rolledData.map(([year, count]) => ({ value: count, label: String(year) }));
  if (chartData.length === 0) return;

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(chartData);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  svg.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (_, i) => colors(i))
    .attr('class', (_, i) => (i === selectedIndex ? 'wedge selected' : 'wedge'))
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(projectsGiven, colors);
    });

  legend.selectAll('li')
    .data(chartData)
    .enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('class', (_, i) => (i === selectedIndex ? 'legend-item selected' : 'legend-item'))
    .html(d => `<span class="swatch"></span>${d.label} <em>(${d.value})</em>`)
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(projectsGiven, colors);
    });
}

/* ---------- filtering logic ---------- */
function updateFilteredProjects(projectsGiven, colors) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // Update highlight classes
  svg.selectAll('path')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'wedge selected' : 'wedge'));
  legend.selectAll('li')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

  // Handle filtering logic
  if (selectedIndex === -1) {
    renderProjectsAndTitle(projectsGiven);
  } else if (chartData[selectedIndex]) {
    const selectedYear = String(chartData[selectedIndex].label);
    const filtered = projectsGiven.filter(p => String(p.year) === selectedYear);
    renderProjectsAndTitle(filtered, ` (${selectedYear})`);
  } else {
    console.warn("Selected index out of range — resetting.");
    selectedIndex = -1;
    renderProjectsAndTitle(projectsGiven);
  }
}

/* ---------- render ---------- */
function updateVisuals(filteredProjects) {
  renderProjectsAndTitle(filteredProjects);
  renderPieChart(filteredProjects);
}

updateVisuals(projects);

/* ---------- search ---------- */
searchInput.addEventListener('input', event => {
  query = event.target.value.toLowerCase();
  const filteredByQuery = projects.filter(project => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  // reset selection when searching
  selectedIndex = -1;
  updateVisuals(filteredByQuery);
});
