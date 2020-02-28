import { constants } from '../constants';

export class DotEffect extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'dot');
    this.scene = scene;
    this.setDepth(-5);
  }

  setColorId(colorId) {
    this.colorId = colorId;
    this.setTint(constants.COLORS[colorId].clone().lighten(100)._color);
  }

  spawn() {
    this.setActive(true);
    this.setVisible(true);

    this.scene.tweens.add({
      targets: this,
      scaleX: {from: 0, to: this.dotScale * 3},
      scaleY: {from: 0, to: this.dotScale * 3},
      alpha: {from: 0.5, to: 0},
      ease: 'Circ.easeOut',
      duration: 1000
    })
    .setCallback('onComplete', () => {
      this.group.killAndHide(this);
    }, []);
  }
}