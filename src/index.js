require("../assets/stylesheets/styles.scss");
import { MainScene } from './script.js';

const env = new MainScene();
env.buildGeom();
env.postProcessing();
env.animate();