import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement && Array.isArray(projects)) {
  titleElement.textContent = `${projects.length} Projects`;
}

const data = [1, 2];

const svg = d3.select('#projects-plot');
const arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

const sliceGenerator = d3.pie();
const arcData = sliceGenerator(data);

const arcs = arcData.map(d => arcGenerator(d));

const colors = ['gold', 'purple'];

arcs.forEach((arc, i) => {
  svg.append('path')
    .attr('d', arc)
    .attr('fill', colors[i]);
});