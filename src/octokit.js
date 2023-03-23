import { Octokit } from "@octokit/core";
import octicons from '@primer/octicons';
import numeral from 'numeral';

import { getProjectUpdateRelativeTime } from './index.js';

const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const maxProjects = 3;

const octokit = new Octokit({ auth: githubToken });

export async function setMyProjects() {
  const response = await octokit.request('GET /user/repos', {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      "Access-Control-Allow-Origin": "*",
    },
    affiliation: "owner",
    sort: "updated",
    per_page: maxProjects,
  });

  for(let i = 0; i < Math.min(response.length, maxProjects); i++) {
    buildProjectCard(response[i])
  }
}

function buildProjectCard(json) {
  const projectCard = document.createElement('a');
  projectCard.title = json['name'];
  projectCard.href = json['html_url'];
  projectCard.target = '_blank';
  projectCard.classList.add('project-item');

  // format number (1000 -> 1k ; 1500 -> 1.5k)
  const stars = numeral(json['stargazers_count']).format('0.[0]a');

  // TODO : 
  // - add language icon ${json['language']}
  projectCard.innerHTML =
  `<div>
    <div class='project-item-title'>
      <div>
        <span>${json['name']}</span>
        <span data-updated-at=${json['updated_at']} class='project-updated-at'>${getProjectUpdateRelativeTime(json['updated_at'])}</span>
      </div>
      <a class='project-star' href='${json['html_url'] + '/stargazers'}' title='${json['name']} stargazers' target='_blank'>${octicons.star.toSVG()} ${stars}</a>
    </div>
    <p>${json['description']}</p>
  </div>`;

  document.getElementById('projects-row').appendChild(projectCard);
}