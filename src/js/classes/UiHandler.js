import { GAME_STATE, GAME_CONSTANTS } from '../scenes/GameScene';
import { Button } from './Button';

export class UiHandler {
  /**
   * Handles UI for the game.
   * @param {Phaser.Scene} scene - The scene this belongs to
   * @param {HTMLCanvasElement} canvas - The canvas to use for positioning
   */
  constructor(scene, canvas) {

    // This is a dictionary containing a separate array of UI elements for each game state.
    // Their visibility is handled in this.setState().
    this.uiElements = {};

    // UI elements: Start Screen
    let startOverlay = scene.add.rectangle(
      canvas.width/2,
      canvas.height/2,
      canvas.width,
      canvas.height,
      0x000000,
      100
    );
    startOverlay.on('pointerdown', () => { scene.setState(GAME_STATE.RUNNING) });
    startOverlay.setInteractive();

    let titleText = scene.add.bitmapText(canvas.width/2, canvas.height/2 - 100, 'bloggerSans', 'H E X D O T S', 115);
    titleText.setOrigin(0.5, 0.5);

    let startText = scene.add.bitmapText(canvas.width/2, canvas.height/2 + 50, 'bloggerSans', 'Click to Start', 64);
    startText.setOrigin(0.5, 0.5);

    this.uiElements[GAME_STATE.START] = [
      startOverlay,
      titleText,
      startText
    ];


    // UI Elements: While game is running
    this.timerDisplay = scene.add.bitmapText(canvas.width/2, 32, 'bloggerSansBold', Math.floor(GAME_CONSTANTS.ROUND_TIME/1000), 64);
    this.timerDisplay.setOrigin(0.5, 0.5);

    this.pointsDisplay = scene.add.bitmapText(48, 32, 'bloggerSansBold', 0, 48);
    this.pointsDisplay.setOrigin(0, 0.5);

    this.colorOverlay = scene.add.rectangle(
      canvas.width/2,
      canvas.height/2,
      canvas.width,
      canvas.height,
      0xffffff,
      240
    );
    this.colorOverlay.setDepth(-8);

    this.uiElements[GAME_STATE.RUNNING] = [
      this.pointsDisplay,
      this.timerDisplay,
      this.colorOverlay
    ]


    // UI Elements: Game Over screen
    let gameOverOverlay = scene.add.rectangle(
      canvas.width/2,
      canvas.height/2,
      canvas.width,
      canvas.height,
      0x000000,
      100
    );

    let timesUp = scene.add.bitmapText(canvas.width/2, 140, 'bloggerSansBold', "Time's Up!", 100);
    timesUp.setOrigin(0.5, 0.5);

    this.yourScore = scene.add.bitmapText(canvas.width/2, 260, 'bloggerSans', "Your Score:", 80);
    this.yourScore.setOrigin(0.5, 0.5);

    let restartButton = new Button(scene, 250, 425, 170, 60, 'Restart');
    restartButton.rectangle.on('pointerdown', () => scene.restart());

    let exitButton = new Button(scene, 550, 425, 170, 60, 'Exit');
    exitButton.rectangle.on('pointerdown', () => scene.exit());

    this.uiElements[GAME_STATE.OVER] = [
      gameOverOverlay,
      timesUp,
      this.yourScore,
      restartButton,
      exitButton
    ];

    // Start with all UI hidden
    Object.values(this.uiElements).forEach((elements) => {
      elements.forEach((element) => {
        element.setVisible(false);
      });
    });
  }

  changeState(oldState, newState) {
    // hide previous state UI
    if (this.uiElements[oldState]) {
      this.uiElements[oldState].forEach((element) => {
        element.setVisible(false);
      });
    }

    // show new state UI
    this.uiElements[newState].forEach((element) => {
      element.setVisible(true);
    });
  }
}