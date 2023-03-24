require("../assets/stylesheets/styles.scss");

import { dom, library } from '@fortawesome/fontawesome-svg-core'
import { faInstagram, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons'

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../assets/translations/en.json';
import fr from '../assets/translations/fr.json';

import { BackgroundScene } from './scene.js';
import { setMyProjects, setActivity } from './octokit.js';

// Load needed icons
library.add(faInstagram, faGithub, faLinkedinIn)
dom.watch()

// Internationalization
i18next.use(LanguageDetector).init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr'],
  // debug: false,
  resources: {
    en: {
      translation: en,
    },
    fr: {
      translation: fr,
    },
  },
}, function(err, t) {
  // initialize default translation
  updateContent();
});

// Update text depending on language
function updateContent() {
  Array.from(document.querySelectorAll('#languages > button')).forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('lang-' + i18next.language);
  if(activeBtn !== null) {
    activeBtn.classList.add( 'active' );
  }

  document.getElementById('18n-loading').innerHTML = i18next.t('loading.title');
  document.getElementById('18n-loading-sub').innerHTML = i18next.t('loading.sub');
  document.getElementById('18n-name-1').innerHTML = i18next.t('name');
  document.getElementById('18n-name-2').innerHTML = i18next.t('name');
  document.getElementById('18n-position').innerHTML = i18next.t('position');

  document.getElementById('description').innerHTML = '';
  i18next.t('description', { returnObjects: true }).forEach((item, _) => {
    const p = document.createElement("p");
    p.innerHTML = item;
    document.getElementById('description').appendChild(p);
  });

  document.getElementById('18n-position-location').innerHTML = i18next.t('position') + ' ' + i18next.t('location');
  document.getElementById('18n-credits-1').innerHTML = i18next.t('credits.0');
  document.getElementById('18n-credits-2').innerHTML = i18next.t('credits.1', { currentYear: new Date().getFullYear() });

  document.querySelector('#projects h2').innerHTML = i18next.t('github.projects_title') ;
  document.querySelector('#activity h2').innerHTML = i18next.t('github.activity_title', { val: new Date(), formatParams: {
      val: { year: 'numeric', month: 'long' },
    },
  });

  translateProjects();
  translateActivity();
}

// Translate projects update relative time
export function translateProjects() {
  document.querySelectorAll('.project-updated-at').forEach(function(projectItem) {
    projectItem.innerHTML = getProjectUpdateRelativeTime(projectItem.dataset.updatedAt);
  });
}

/// Returns the relative time between today and [stringDate]
function getProjectUpdateRelativeTime(stringDate) {
  const today = new Date();
  const d = new Date(stringDate);

  const diffTime = Math.abs(d - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return ` · ${i18next.t('github.project_updated', { val: -diffDays })}`;
}

// Translate activities title
export function translateActivity() {
  document.querySelectorAll('.timeline-item').forEach(function(activityItem) {

    const title = activityItem.querySelector('.activity-title');
    const params = { repoCount: activityItem.dataset.repoCount, targetCount: activityItem.dataset.targetCount }

    switch (activityItem.id) {
      case 'activity-commits':
        title.innerHTML = i18next.t('github.commits', params);
        break;
      case 'activity-repositories':
        title.innerHTML = i18next.t('github.repositories', params);
        break;
      case 'activity-pull-requests':
        title.innerHTML = i18next.t('github.pull_requests', params);
        break;
      case 'activity-issues':
        title.innerHTML = i18next.t('github.issues', params);
        break;
      case 'activity-reviews':
        title.innerHTML = i18next.t('github.reviews', params);
        break;
      default:
        break;
    }
  });
}

window.changeLng = i18next.changeLanguage;
i18next.on('languageChanged', updateContent);

// GitHub API
setMyProjects();
setActivity();

// 3D Scene 
const env = new BackgroundScene();
env.buildGeom();
env.postProcessing();
env.animate();