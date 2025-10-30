import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

renderProjects(projects, projectsContainer, 'h2');
titleElement.textContent = `${projects.length} Projects`;

let query = '';

function drawChart(dataArray) {
  d3.select('#projects-plot').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

  const svg = d3.select('#projects-plot');
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(dataArray);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i));
  });

  const legend = d3.select('.legend');
  dataArray.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span>${d.label} <em>(${d.value})</em>`);
  });
}

function updateVisuals(filteredProjects) {
  projectsContainer.innerHTML = '';
  renderProjects(filteredProjects, projectsContainer, 'h2');
  titleElement.textContent = `${filteredProjects.length} Projects`;

  const rolledData = d3.rollups(filteredProjects, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  if (data.length > 0) drawChart(data);
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
