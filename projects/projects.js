import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let selectedIndex = -1; // no wedge selected
let query = ''; // track search query

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  if (data.length === 0) return;

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(data);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  svg.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (_, i) => colors(i))
    .attr('class', 'wedge')
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(data, projectsGiven, colors);
    });

  legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('class', 'legend-item')
    .html(d => `<span class="swatch"></span>${d.label} <em>(${d.value})</em>`)
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(data, projectsGiven, colors);
    });
}

function updateFilteredProjects(data, projectsGiven, colors) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'wedge selected' : 'wedge'));

  legend.selectAll('li')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

  if (selectedIndex === -1) {
    // show all projects
    renderProjects(projectsGiven, projectsContainer, 'h2');
    titleElement.textContent = `${projectsGiven.length} Projects`;
  } else {
    // show only projects matching the selected year
    const selectedYear = data[selectedIndex].label;
    const filtered = projectsGiven.filter(p => p.year === selectedYear);
    renderProjects(filtered, projectsContainer, 'h2');
    titleElement.textContent = `${filtered.length} Projects (${selectedYear})`;
  }
}

function updateVisuals(filteredProjects) {
  projectsContainer.innerHTML = '';
  renderProjects(filteredProjects, projectsContainer, 'h2');
  titleElement.textContent = `${filteredProjects.length} Projects`;
  renderPieChart(filteredProjects);
}

updateVisuals(projects);

searchInput.addEventListener('input', event => {
  query = event.target.value.toLowerCase();
  const filteredProjects = projects.filter(project => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  updateVisuals(filteredProjects);
});
