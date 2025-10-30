import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement && Array.isArray(projects)) {
  titleElement.textContent = `${projects.length} Projects`;
}

const svg = d3.select('#projects-plot');

const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(50)({
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });

svg.append('path')
  .attr('d', arc)
  .attr('fill', 'red');