import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let selectedIndex = -1;   
let query = '';          


function renderProjectsAndTitle(list, extra = '') {
  projectsContainer.innerHTML = '';
  renderProjects(list, projectsContainer, 'h2');
  titleElement.textContent = `${list.length} Projects${extra}`;
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();


  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ value: count, label: String(year) }));
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
    .attr('class', (_, i) => (i === selectedIndex ? 'wedge selected' : 'wedge'))
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(data, projectsGiven);
    });

  legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('class', (_, i) => (i === selectedIndex ? 'legend-item selected' : 'legend-item'))
    .html(d => `<span class="swatch"></span>${d.label} <em>(${d.value})</em>`)
    .on('click', function (_, i) {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateFilteredProjects(data, projectsGiven);
    });
}
function updateFilteredProjects(data, projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'wedge selected' : 'wedge'));
  legend.selectAll('li')
    .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

  if (selectedIndex === -1) {
    renderProjectsAndTitle(projectsGiven);
  } else {
    const selectedYear = String(data[selectedIndex].label);
    const filtered = projectsGiven.filter(p => String(p.year) === selectedYear);
    renderProjectsAndTitle(filtered, ` (${selectedYear})`);
  }
}

function updateVisuals(list) {
  renderProjectsAndTitle(list);
  renderPieChart(list);
}

updateVisuals(projects);

searchInput.addEventListener('input', event => {
  query = event.target.value.toLowerCase();

  const filteredByQuery = projects.filter(project => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  selectedIndex = -1;
  updateVisuals(filteredByQuery);
});
