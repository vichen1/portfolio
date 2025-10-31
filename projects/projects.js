import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let selectedIndex = -1;  
let query = '';           
let chartData = [];       

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
    .attr('fill', (d, i) => colors(i))
    .attr('class', (d, i) => (i === selectedIndex ? 'selected' : ''))
    .style('cursor', 'pointer')
    .on('click', function (event, d) {
      const clickedIndex = arcData.indexOf(d);
      selectedIndex = selectedIndex === clickedIndex ? -1 : clickedIndex;
      updateFilteredProjects(projectsGiven, colors);
    });

  legend.selectAll('li')
    .data(chartData)
    .enter()
    .append('li')
    .attr('style', (d, i) => `--color:${colors(i)}`)
    .attr('class', (d, i) => (i === selectedIndex ? 'selected' : ''))
    .html(d => `<span class="swatch"></span>${d.label} <em>(${d.value})</em>`)
    .style('cursor', 'pointer')
    .on('click', function (event, d) {
      const clickedIndex = chartData.indexOf(d);
      selectedIndex = selectedIndex === clickedIndex ? -1 : clickedIndex;
      updateFilteredProjects(projectsGiven, colors);
    });
}

/* ---------- filtering logic ---------- */
function updateFilteredProjects(projectsGiven, colors) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // Update highlight classes
  svg.selectAll('path')
    .attr('class', (d, idx) => (idx === selectedIndex ? 'selected' : ''));
  legend.selectAll('li')
    .attr('class', (d, idx) => (idx === selectedIndex ? 'selected' : ''));

  // Handle filtering logic
  if (selectedIndex === -1) {
    renderProjectsAndTitle(projectsGiven);
  } else {
    const selectedYear = chartData[selectedIndex].label;
    const filtered = projectsGiven.filter(p => String(p.year) === selectedYear);
    renderProjectsAndTitle(filtered, ` (${selectedYear})`);
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