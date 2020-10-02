require("../assets/stylesheets/styles.scss");
import '@fortawesome/fontawesome-free/js/all.js';
import { BackgroundScene } from './scene.js';

const env = new BackgroundScene();
env.buildGeom();
env.postProcessing();
env.animate();