export class Button {
  constructor(scene, x, y, width, height, label='') {
    this.rectangle = scene.add.rectangle(x, y, width, height);
    this.rectangle.setFillStyle(0x000000, 255);
    this.rectangle.setStrokeStyle(3, 0xffffff, 1);
    this.rectangle.isStroked = true;
    this.rectangle.setInteractive();

    this.label = scene.add.bitmapText(x, y - 22, 'bloggerSans', label, 48);
    this.label.setOrigin(0.5, 0.5);
  }

  setVisible(visible) {
    this.rectangle.setVisible(visible);
    this.label.setVisible(visible);
  }
}