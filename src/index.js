require("../assets/stylesheets/styles.scss");
import '@fortawesome/fontawesome-free/js/all.js';
import { MainScene } from './script.js';

const env = new MainScene();
env.buildGeom();
env.postProcessing();
env.animate();