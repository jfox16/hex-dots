import { DOT_COLORS } from './Dot';

/**
 * DotEffect is the light colored circle that appears under a Dot when it is selected.
 */
export class DotEffect extends Phaser.GameObjects.Image {
  /**
   * 
   * @param {Phaser.Scene} scene - The scene that this belongs to
   * @param {number} x - The x coordinate of this in world space
   * @param {number} y - The y coordinate of this in world space
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'dot');
    this.scene = scene;
    this.setDepth(-5);
  }

  setColorId(colorId) {
    this.colorId = colorId;
    this.setTint(DOT_COLORS[colorId].clone().lighten(100)._color);
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