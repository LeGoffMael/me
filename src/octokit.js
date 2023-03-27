import { Octokit } from "@octokit/core";
import octicons from '@primer/octicons';
import numeral from 'numeral';

import { translateProjects, translateActivity } from './index.js';

const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const octokit = new Octokit({ auth: githubToken });

const maxProjects = 3;
const maxActivityEvents = 100; // max possible results per page

/// MY PROJECTS ///

/// Fetch all my last 3 updated projects
export async function setMyProjects() {
  const response = await octokit.request('GET /user/repos', {
    affiliation: 'owner,collaborator',
    sort: 'pushed',
  });

  const data = response.data;

  let projectCount = 0;
  for(let i = 0; i < data.length && projectCount < maxProjects; i++) {
    const item = data[i];
    // exclude project with less than 10 stars and forks from projects list
    if(item['fork'] == true || item['stargazers_count'] < 10) continue;

    buildProjectCard(item);
    projectCount++;
  }

  translateProjects();
}

// Function that returns the techno used based on the progamming language
// For now only used to show flutter instead of dart since it is more famous
function technoWrapper(val) {
  const lang = val.toLowerCase();
  switch (lang) {
    case 'dart':
      return 'flutter'
    default:
      return lang;
  }
}

/// Add a project item in the DOM
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
  `<div class='project-item-title'>
    <div>
      <i class='devicon-${technoWrapper(json['language'])}-plain'/></i>
      <span>${json['name']}</span>
      <span data-updated-at=${json['pushed_at']} class='project-updated-at'></span>
    </div>
    <a class='project-star' href='${json['html_url'] + '/stargazers'}' title='${json['name']} stargazers' target='_blank'>
      ${octicons.star.toSVG()}
      <span> ${stars}</span>
    </a>
  </div>
  <p>${json['description']}</p>`;

  document.getElementById('projects-row').appendChild(projectCard);
}

/// My Activity ///

const myActivity = {
  commitsKey : {
    iconSvg: octicons["repo-push"].toSVG(),
    isCommits: true,
    repoCount: 0,
    targetCount: 0,
    events: [],
    repositories: []
  },
  repositoriesKey : {
    iconSvg: octicons.repo.toSVG(),
    isCommits: false,
    repoCount: 0,
    targetCount: 0,
    events: [],
    repositories: []
  },
  pullRequestsKey : {
    iconSvg: octicons["git-pull-request"].toSVG(),
    isCommits: false,
    repoCount: 0,
    targetCount: 0,
    events: [],
    repositories: []
  },
  issuesKey : {
    iconSvg: octicons["issue-opened"].toSVG(),
    isCommits: false,
    repoCount: 0,
    targetCount: 0,
    events: [],
    repositories: []
  },
  reviewsKey : {
    iconSvg: octicons.eye.toSVG(),
    isCommits: false,
    repoCount: 0,
    targetCount: 0,
    events: [],
    repositories: []
  },
}

/// Replace API url `api.github.com` by html url `github.com`
function cleanGitHubUrl(url) {
  return url.replace('https://api.github.com', 'https://github.com');
}

/// Replace repository API url `api.github.com/repos` by html url `github.com`
function cleanRepoGitHubUrl(url) {
  return url.replace('https://api.github.com/repos', 'https://github.com');
}

class ActivityEvent {
  constructor(json) {
    // List of possible events from GitHub
    // from: https://docs.github.com/en/webhooks-and-events/events/github-event-types
    switch (json['type']) {
      case 'ForkEvent': // fork a repository
        this.type = 'repositoriesKey';
        this.repoName = json['payload']['forkee']['full_name'];
        this.repoUrl = cleanGitHubUrl(json['payload']['forkee']['html_url']);
        break;
      case 'IssuesEvent': // an issue is opened or closed
        this.type = 'issuesKey';
        this.targetLabel = '#' + json['payload']['issue']['number'];
        this.targetUrl = cleanGitHubUrl(json['payload']['issue']['html_url']);
        break;
      case 'IssueCommentEvent': // comment is added to an issue
        this.type = 'issuesKey';
        this.targetLabel = '#' + json['payload']['issue']['number'];
        this.targetUrl = cleanGitHubUrl(json['payload']['issue']['html_url']);
        break;
      case 'PublicEvent': // a repository is made public
        this.type = 'repositoriesKey';
        break;
      case 'PullRequestEvent': // pull requests is opened or closed
        this.type = 'pullRequestsKey';
        this.targetLabel = '#' + json['payload']['pull_request']['number'];
        this.targetUrl = cleanGitHubUrl(json['payload']['pull_request']['html_url']);
        break;
      case 'PullRequestReviewThreadEvent': // pull request comment thread marked as resolved
        this.type = 'reviewsKey';
        this.targetLabel = '#' + json['payload']['pull_request']['number'];
        this.targetUrl = cleanGitHubUrl(json['payload']['pull_request']['html_url']);
        break;
      case 'PushEvent': // commit is pushed
        this.type = 'commitsKey';
        this.targetCount = json['payload']['size'];
        break;
      default:
        // CommitCommentEvent -> a commit comment is created
        // CreateEvent -> branch or tag is created
        // DeleteEvent -> branch or tag is deleted
        // GollumEvent -> wiki page created or updated
        // IssuesEvent -> activity related to an issue
        // MemberEvent -> activity related to collaborator
        // PullRequestReviewEvent -> activity related to pull request reviews
        // PullRequestReviewCommentEvent -> activity related to pull request review comments
        // ReleaseEvent -> activity related to release
        // SponsorshipEvent -> activity related to sponsorship
        // WatchEvent -> star event
        return null;
    }

    if(this.targetCount === undefined) {
      this.targetCount = 1;
    }
    if(this.repoName === undefined) {
      this.repoName = json['repo']['name'];
    }
    if(this.repoUrl === undefined) {
      this.repoUrl = cleanRepoGitHubUrl(json['repo']['url']);
    }
  }

  /// Returns the target object 
  getTarget() {
    if(this.targetLabel === undefined && this.targetUrl === undefined) return null;

    return {
      label: this.targetLabel,
      url: this.targetUrl
    }
  }
}

/// Fetch last [maxActivityEvents] my activity events from this month
export async function setActivity() {
  const now = new Date();
  let response;

  try {
    response = await octokit.request('GET /users/legoffmael/events', {
      per_page: maxActivityEvents,
    });
  } catch {
    // hide activity panel if error occured on call
    hideActivity();
    return;
  }

  const data = response.data;
  for(const i in data) {
    const event = data[i];

    // if event is not from this month, stop loop
    const createdAt = new Date(event['created_at']);
    if(now.getFullYear() !== createdAt.getFullYear() || now.getMonth() !== createdAt.getMonth()) {
      break;
    }

    const e = new ActivityEvent(event);

    if(e.type !== undefined) {
      myActivity[e.type].events.push(e)

      const target = e.getTarget();

      const repo = {
        name: e.repoName,
        url: e.repoUrl,
        count: e.targetCount,
        target: target
      }

      // index of this repo with this target
      const index = myActivity[e.type].repositories.findIndex(r =>
        r.name === e.repoName && (target !== null
          ? r.target.url === target.url
          : true));

      // count all unique targets for this type
      if(index === -1 || e.type == 'commitsKey') {
        myActivity[e.type].targetCount += e.targetCount;
      }

      // if repo data with target does not exists yet
      if(index === -1) {
        // count all unique repositories for this type
        if(myActivity[e.type].repositories.findIndex(r =>
          r.name === e.repoName) === -1) {
          myActivity[e.type].repoCount++;
        }
        myActivity[e.type].repositories.push(repo);
      } else  {
        // count duplicate event for this repository (i.e. nb commits)
        myActivity[e.type].repositories[index].count += e.targetCount;
      }
    }
  }

  buildActivity("activity-commits", myActivity.commitsKey);
  buildActivity("activity-repositories", myActivity.repositoriesKey);
  buildActivity("activity-pull-requests", myActivity.pullRequestsKey);
  buildActivity("activity-issues", myActivity.issuesKey);
  buildActivity("activity-reviews", myActivity.reviewsKey);

  // if there is no activity, hide the container
  if(document.querySelectorAll('.timeline-item').length === 0) {
    hideActivity();
  }

  translateActivity();
}

function hideActivity() {
  console.error('No activity were foud, the timeline will be hidden');
  document.getElementById('activity').style.display = 'none';
}

/// Add an activity item in the DOM
function buildActivity(id, json) {
  if(json.events.length === 0) {
    return;
  }

  const activityItem = document.createElement('div');
  activityItem.id = id;
  activityItem.classList.add('timeline-item');
  activityItem.dataset.repoCount = json.repoCount;
  activityItem.dataset.targetCount = json.targetCount;
  
  activityItem.innerHTML =
  `<div class='activity-title-wrapper'>
    ${json.iconSvg}
    <span class="activity-title"></span>
  </div>`;

  const repositoriesList = document.createElement('ul');
  json.repositories.forEach((repo, _) => {
    const targetContent = json.isCommits ? `${repo.count} commits` : repo.target !== null ? `<a href='${repo.target.url}' target='_blank'>${repo.target.label}</a>` : '';

    const repoItem = document.createElement('li');
    repoItem.innerHTML = `<a href='${repo.url}' target='_blank'>${repo.name}</a><span class="activity-target">${targetContent}</span>`;

    repositoriesList.appendChild(repoItem);
  });

  activityItem.append(repositoriesList);
  document.querySelector('#activity .timeline').appendChild(activityItem);
}