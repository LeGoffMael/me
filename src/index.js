require("../assets/stylesheets/styles.scss");

import { dom, library } from '@fortawesome/fontawesome-svg-core'
import { faInstagram, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons'

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../assets/translations/en.json';
import fr from '../assets/translations/fr.json';

import { BackgroundScene } from './scene.js';

// Load needed icons
library.add(faInstagram, faGithub, faLinkedinIn)
dom.watch()

// Internationalization
i18next.use(LanguageDetector).init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr'],
  debug: false,
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
}

window.changeLng = i18next.changeLanguage;
i18next.on('languageChanged', updateContent);

// 3D Scene 
const env = new BackgroundScene();
env.buildGeom();
env.postProcessing();
env.animate();