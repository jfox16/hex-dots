/**
 * Button is a clickable rectangle with text over it. 
 */
export class Button {
  /**
   * Create a new button.
   * @param {Phaser.Scene} scene - The scene that this belongs to
   * @param {number} x - The x coordinate of this in world space
   * @param {number} y - The y coordinate of this in world space
   * @param {number} width - The width of the rectangle in pixels
   * @param {number} height - The height of the rectangle in pixels
   * @param {string} label - The text to be displayed on the button
   */
  constructor(scene, x, y, width, height, label='') {
    this.rectangle = scene.add.rectangle(x, y, width, height);
    this.rectangle.setFillStyle(0x000000, 255);
    this.rectangle.setStrokeStyle(3, 0xffffff, 1);
    this.rectangle.isStroked = true;
    this.rectangle.setInteractive();

    this.label = scene.add.bitmapText(x, y - 22, 'bloggerSans', label, 48);
    this.label.setOrigin(0.5, 0.5);
  }

  // Make this button visible or not.
  setVisible(visible) {
    this.rectangle.setVisible(visible);
    this.label.setVisible(visible);
  }
}