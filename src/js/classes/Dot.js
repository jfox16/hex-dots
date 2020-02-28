const Color = Phaser.Display.Color;

export const DOT_STATE = {
  NONE: 0,
  SELECTED: 1
};

export const DOT_COLORS = [
  Color.HSLToColor(0.00, 0.85, 0.60),  // Red
  Color.HSLToColor(0.62, 0.95, 0.60),  // Blue
  Color.HSLToColor(0.14, 0.85, 0.60),  // Yellow
  Color.HSLToColor(0.83, 0.85, 0.70),  // Pink
  Color.HSLToColor(0.27, 0.95, 0.63),  // Green
  Color.HSLToColor(0.06, 0.90, 0.60),  // Orange
  Color.HSLToColor(0.75, 0.85, 0.55),  // Purple
  Color.HSLToColor(0.47, 0.67, 0.55)   // Cyan
];

const touchRadius = 70;

/**
 * Represents a Dot. Extends from Image. Can be clicked, colored, animated, etc
 */
export class Dot extends Phaser.GameObjects.Image {
  /**
   * Makes a new dot and initializes it. The spawn() function must be called before the dot is usable.
   * @param {Phaser.Scene} scene - The scene that this belongs to
   * @param {number} x - The x coordinate of this in world space
   * @param {number} y - The y coordinate of this in world space
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'dot');

    let touchCircle = new Phaser.Geom.Circle(64, 64, touchRadius);
    this.setInteractive(touchCircle, Phaser.Geom.Circle.Contains);
    
    this.t = 0; // used for animating movement on path
    this.dotScale = 1;
  }

  update() {
    if (this.path && this.t >= 0) {
      let vec = new Phaser.Math.Vector2();
      this.path.getPoint(this.t, vec);
      this.setPosition(vec.x, vec.y);
    }
  }

  setGridPosition(row, column) {
    this.row = row;
    this.column = column;
  }

  setColorId(colorId) {
    this.colorId = colorId;
    this.setTint(DOT_COLORS[colorId]._color);
  }

  setState(state) {
    this.state = state;
  }

  spawn() {
    this.setState(DOT_STATE.NONE);
    this.setActive(true);
    this.setVisible(true);

    // Start spawn animation
    this.scene.tweens.add({
      targets: this,
      scaleX: {from: 0, to: this.dotScale},
      scaleY: {from: 0, to: this.dotScale},
      ease: 'Bounce.out',
      duration: 300,
    });
  }

  despawn() { 
    // Start disappear animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      ease: 'Sine.easeIn',
      duration: 100,
    })
    .setCallback('onComplete', () => {
      this.group.killAndHide(this);
    }, []);
  }

  startFall(path) {
    this.path = path;
    this.scene.tweens.add({
      targets: this,
      t: {from: 0, to: 1},
      ease: 'Bounce.out',
      duration: 700
    })
    .setCallback('onComplete', () => {
      this.t = -1;
    }, []);
  }
}