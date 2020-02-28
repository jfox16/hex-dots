import { constants } from '../constants';

const touchRadius = 70;

export const state = {
  NONE: 0,
  SELECTED: 1
}

export class Dot extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'dot');

    let touchCircle = new Phaser.Geom.Circle(64, 64, touchRadius);
    this.setInteractive(touchCircle, Phaser.Geom.Circle.Contains);

    this.t = 0; // used for animating movement on path
  }

  moveOnPath() {
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
    this.setTint(constants.COLORS[colorId]._color);
  }

  setState(state) {
    this.state = state;
  }
}