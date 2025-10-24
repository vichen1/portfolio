import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h3');

const githubData = await fetchGithubData('vichen1');
if (githubData) {
  document.querySelector('#github-followers').textContent =
    `Followers: ${githubData.followers}`;
  document.querySelector('#github-repos').textContent =
    `Public Repositories: ${githubData.public_repos}`;
}
