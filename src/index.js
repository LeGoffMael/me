require("../assets/stylesheets/styles.scss");
import '@fortawesome/fontawesome-free/js/all.js';
import i18next from 'i18next';
import { BackgroundScene } from './scene.js';

// Internationalization
i18next.init({
    lng: 'en',
    debug: false,
    resources: {
      en: {
        translation: {
            name: 'Maël Le Goff',
            position: 'Software Engineer',
            description: [
                'I am a Software Engineer recently <a href="https://www.utbm.fr/" target="_blank">graduated</a>.',
                'Born in France I am now based <s>in Seoul, South Korea working as a full stack developer and UI designer <a href="https://www.xenoimpact.com/" target="_blank">@XenoImpact</a></s>.',
                '<a href="http://www.v2.legoffmael.fr/resources/RESUME_LE_GOFF_MAEL.pdf" target="_blank">Check out</a> my resume and/or <a href="mailto:legoffmael@gmail.com" target="_blank">reach out</a> if you are interested by my works.'
            ],
            location: 'in <s>South Korea</s>',
            credits: [
                'Many thanks to <a href="https://sketchfab.com/Epidural" target="_blank">@Epidural</a> how designed the <a href="https://sketchfab.com/3d-models/head-drawing-foundation-746f57f1ef664ecbbd2d3e69b2ca32c7" target="_blank">3D model</a>.',
                '© 2020 Designed and coded by Maël Le Goff.'
            ],
            loading: {
                title: 'Loading...',
                sub: 'It should not be long',
            }
        }
      },
      fr: {
        translation: {
            name: 'Maël Le Goff',
            position: 'Ingénieur Logiciel',
            description: [
                'Je suis un Ingénieur Informatique récemment <a href="https://www.utbm.fr/" target="_blank">diplomé</a>.',
                'Né en France je vis désormais <s>à Séoul, Corée du Sud travaillant en tant que développeur full stack et UI designer <a href="https://www.xenoimpact.com/" target="_blank">@XenoImpact</a></s>.',
                '<a href="http://www.v2.legoffmael.fr/resources/RESUME_LE_GOFF_MAEL.pdf" target="_blank">Téléchargez</a> mon CV et/ou <a href="mailto:legoffmael@gmail.com" target="_blank">contactez moi</a> si vous êtes intéressé par mon travail.'
            ],
            location: 'en <s>Corée du Sud</s>',
            credits: [
                'Merci à <a href="https://sketchfab.com/Epidural" target="_blank">@Epidural</a> qui a conçu le <a href="https://sketchfab.com/3d-models/head-drawing-foundation-746f57f1ef664ecbbd2d3e69b2ca32c7" target="_blank">modèle 3D</a>.',
                '© 2020 Imaginé et codé par Maël Le Goff.'
            ],
            loading: {
                title: 'Chargement...',
                sub: 'Ça ne devrait pas être long',
            }
        }
      }
    }
  }, function(err, t) {
    // init set content
    updateContent();
  });

  /**
   * Update text depending language
   */
  function updateContent() {
    document.getElementById('18n-loading').innerHTML = i18next.t('loading.title');
    document.getElementById('18n-loading-sub').innerHTML = i18next.t('loading.sub');
    document.getElementById('18n-name-1').innerHTML = i18next.t('name');
    document.getElementById('18n-name-2').innerHTML = i18next.t('name');
    document.getElementById('18n-position').innerHTML = i18next.t('position');
    document.getElementById('18n-description-1').innerHTML = i18next.t('description.0');
    document.getElementById('18n-description-2').innerHTML = i18next.t('description.1');
    document.getElementById('18n-description-3').innerHTML = i18next.t('description.2');
    document.getElementById('18n-position-location').innerHTML = i18next.t('position') + ' ' + i18next.t('location');
    document.getElementById('18n-credits-1').innerHTML = i18next.t('credits.0');
    document.getElementById('18n-credits-2').innerHTML = i18next.t('credits.1');
  }

  function changeLng(lng) {
    i18next.changeLanguage(lng);
    Array.from(document.querySelectorAll('#languages > button')).forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('lang-'+lng).classList.add( 'active' );
  }
  window.changeLng = changeLng;
  
  i18next.on('languageChanged', () => {
    updateContent();
  });

// 3D Scene 
const env = new BackgroundScene();
env.buildGeom();
env.postProcessing();
env.animate();