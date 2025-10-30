import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement && Array.isArray(projects)) {
  titleElement.textContent = `${projects.length} Projects`;
}
const svg = d3.select("#projects-plot");

svg.append("circle")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", 50)
  .attr("fill", "red");