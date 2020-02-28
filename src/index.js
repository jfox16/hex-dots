import Phaser from "phaser";
import { LoadScene } from "./js/scenes/LoadScene";
import { GameScene } from "./js/scenes/GameScene";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    LoadScene,
    GameScene
  ]
};

const game = new Phaser.Game(config);
