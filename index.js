import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

try {
  const projects = await fetchJSON('./lib/projects.json');
  if (projects && projects.length > 0) {
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.projects');
    renderProjects(latestProjects, projectsContainer, 'h3');
  } else {
    console.warn("No projects found or projects.json is empty.");
  }
} catch (error) {
  console.error("Error loading projects:", error);
}

try {
  const githubData = await fetchGitHubData('vichen1');
  if (githubData) {
    const followersElement = document.querySelector('#github-followers');
    const reposElement = document.querySelector('#github-repos');

    if (followersElement && reposElement) {
      followersElement.textContent = `Followers: ${githubData.followers}`;
      reposElement.textContent = `Public Repositories: ${githubData.public_repos}`;
    } else {
      console.warn("GitHub info containers not found in the HTML.");
    }
  } else {
    console.warn("No GitHub data returned.");
  }
} catch (error) {
  console.error("Error fetching GitHub data:", error);
}
