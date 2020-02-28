import { constants } from "../constants";
import gradientBgImg from '../../assets/sprites/gradient-bg.png';
import dotImg from '../../assets/sprites/dot.png';
import bloggerSansTexture from '../../assets/fonts/BloggerSans.png';
import bloggerSansXml from '../../assets/fonts/BloggerSans.fnt';
import bloggerSansBoldTexture from '../../assets/fonts/BloggerSansBold.png';
import bloggerSansBoldXml from '../../assets/fonts/BloggerSansBold.fnt';

export class LoadScene extends Phaser.Scene {
  constructor() {
    super({
      key: constants.SCENES.LOAD,
    });
  }

  init() {
  }

  preload() {
    this.load.image('gradient-bg', gradientBgImg);
    this.load.image('dot', dotImg);
    this.load.bitmapFont('bloggerSans', bloggerSansTexture, bloggerSansXml);
    this.load.bitmapFont('bloggerSansBold', bloggerSansBoldTexture, bloggerSansBoldXml);
  
    // Loading Bar
    let loadingBar = this.add.graphics({
      fillStyle: {
        color: 0xffffff
      }
    });

    this.load.on("progress", (percent) => {
      loadingBar.fillRect(0, this.game.renderer.height / 2, this.game.renderer.width * percent, 50);
    });
  }

  create() {
    this.scene.start(constants.SCENES.GAME);
  }
}