export class TextDisplay {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.text = scene.add.text(x, y);
  }

  setText(text) {
    this.text.setText(text);
  }
}