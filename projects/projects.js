import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement && Array.isArray(projects)) {
  titleElement.textContent = `${projects.length} Projects`;
}

const searchInput = document.querySelector('.searchBar');
let query = '';

searchInput.addEventListener('input', event => {
  query = event.target.value.toLowerCase();

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(query)
  );

  projectsContainer.innerHTML = '';
  d3.select('#projects-plot').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

  renderProjects(filteredProjects, projectsContainer, 'h2');
  titleElement.textContent = `${filteredProjects.length} Projects`;

  const rolledData = d3.rollups(
    filteredProjects,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  const svg = d3.select('#projects-plot');
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(data);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i));
  });

  const legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span>${d.label} <em>(${d.value})</em>`);
  });
});
