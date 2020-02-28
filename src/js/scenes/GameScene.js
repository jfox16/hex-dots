import { constants } from "../constants";
import { DotGrid } from '../classes/DotGrid';
import { Dot, state as dotState } from '../classes/Dot';
import { TextDisplay } from '../classes/TextDisplay';
import { TimerDisplay } from '../classes/TimerDisplay'; 
import { Button } from "../classes/Button";
import { DotEffect } from "../classes/DotEffect";

const NUM_ROWS       = 6;
const NUM_COLUMNS    = 8;
const NUM_COLORS     = 6;
const MIN_LOOP_COUNT = 3; 
// const ROUND_TIME     = 60000;
const ROUND_TIME     = 0;

export class GameScene extends Phaser.Scene {
  
  constructor() {  
    super({
      key: constants.SCENES.GAME
    });
  }

  // PHASER SCENE METHODS =========================================================================

  preload() {
    this.canvas = this.sys.game.canvas;

    // Initialize dot grid
    this.dotGrid = new DotGrid(
      this, 
      NUM_ROWS, 
      NUM_COLUMNS, 
      NUM_COLORS, 
      this.canvas.width/2, 
      this.canvas.height/2 + 25, 
      750, 
      550
    );

    // selection holds info on currently selected dots
    this.selection = {
      selected: [],
      selectedLines: [],
      colorId: 0,
      loop: false
    };

    // Make a group for object-pooling dot effects
    this.dotEffectGroup = this.add.group({
      defaultKey: 'dotEffect',
      maxSize: NUM_ROWS * NUM_COLUMNS,
      classType: DotEffect,
      createCallback: (dotEffect) => {
        dotEffect.setName('dotEffect' + this.dotEffectGroup.getLength());
        dotEffect.group = this.dotEffectGroup;
      }
    });

    this.pointer = this.input.activePointer;
    this.input.on('pointerup', () => this.pointerUp());
    this.points = 0;
  }

  create() {
    // Add Background
    this.add.image(0, 0, "gradient-bg").setOrigin(0,0).setDepth(-10);

    // Dot Grid
    this.dotGrid.drawColumnLines();
    this.dotGrid.fillWithRandomDots();

    // Line graphics
    this.selectedLinesGraphics = this.add.graphics();
    this.pointerLineGraphics = this.add.graphics();

    // Initialize UI Elements
    // This is a dictionary containing a separate array of UI elements for each game state.
    // Their visibility is handled in this.setState().
    this.uiElements = {};

    // UI elements: Start Screen
    let startOverlay = this.add.rectangle(
      this.canvas.width/2,
      this.canvas.height/2,
      this.canvas.width,
      this.canvas.height,
      0x000000,
      100
    );
    startOverlay.on('pointerdown', () => { this.setState(constants.GAME_STATE.RUNNING) });
    startOverlay.setInteractive();

    let titleText = this.add.bitmapText(this.canvas.width/2, this.canvas.height/2 - 100, 'bloggerSans', 'H E X D O T S', 115);
    titleText.setOrigin(0.5, 0.5);

    let startText = this.add.bitmapText(this.canvas.width/2, this.canvas.height/2 + 50, 'bloggerSans', 'Click to Start', 64);
    startText.setOrigin(0.5, 0.5);

    this.uiElements[constants.GAME_STATE.START] = [
      startOverlay,
      titleText,
      startText
    ];


    // UI Elements: While game is running
    this.timerDisplay = this.add.bitmapText(this.canvas.width/2, 32, 'bloggerSansBold', Math.floor(ROUND_TIME/1000), 64);
    this.timerDisplay.setOrigin(0.5, 0.5);

    this.pointsDisplay = this.add.bitmapText(48, 32, 'bloggerSansBold', 0, 48);
    this.pointsDisplay.setOrigin(0, 0.5);

    this.colorOverlay = this.add.rectangle(
      this.canvas.width/2,
      this.canvas.height/2,
      this.canvas.width,
      this.canvas.height,
      0xffffff,
      250
    ),

    this.uiElements[constants.GAME_STATE.RUNNING] = [
      this.pointsDisplay,
      this.timerDisplay,
      this.colorOverlay
    ]


    // UI Elements: Game Over screen
    let gameOverOverlay = this.add.rectangle(
      this.canvas.width/2,
      this.canvas.height/2,
      this.canvas.width,
      this.canvas.height,
      0x000000,
      100
    );

    let timesUp = this.add.bitmapText(this.canvas.width/2, 120, 'bloggerSansBold', "Time's Up!", 100);
    timesUp.setOrigin(0.5, 0.5);

    this.yourScore = this.add.bitmapText(this.canvas.width/2, 250, 'bloggerSans', "Your Score:", 80);
    this.yourScore.setOrigin(0.5, 0.5);

    let restartButton = new Button(this, 250, 425, 170, 60, 'Restart');
    restartButton.rectangle.on('pointerdown', () => this.restart());

    let exitButton = new Button(this, 550, 425, 170, 60, 'Exit');
    exitButton.rectangle.on('pointerdown', () => this.exit());

    this.uiElements[constants.GAME_STATE.OVER] = [
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

    this.setState(constants.GAME_STATE.START);
  }

  update() {
    this.dotGrid.update();
    this.updatePointerLine();
    this.updateTimerDisplay();
  }

  // MAIN METHODS =================================================================================

  setState(state) {
    // hide previous state UI
    if (this.uiElements[this.state]) {
      this.uiElements[this.state].forEach((element) => {
        element.setVisible(false);
      });
    }

    // show new state UI
    this.uiElements[state].forEach((element) => {
      element.setVisible(true);
    });

    this.state = state;

    switch(state) {
      case constants.GAME_STATE.RUNNING:
        this.dotGrid.removeAllDots();
        this.dotGrid.fillWithRandomDots();
        this.endTime = this.time.now + ROUND_TIME + 900;
        this.points = 0;
        this.updateColorOverlay();
        break;

      case constants.GAME_STATE.OVER:
        this.pointerUp();
        this.selection.selected = [];
        this.selection.loop = false;
        this.yourScore.setText("Your Score: " + this.points);
        this.updateColorOverlay();
        break;
    }
  }

  dotClicked(dot) {
    if (this.state !== constants.GAME_STATE.RUNNING) return;

    let selected = this.selection.selected;
    if (selected.length === 0) {
      dot.setState(dotState.SELECTED);
      selected.push(dot);
      this.selection.colorId = dot.colorId;
      this.addDotEffect(dot.x, dot.y, dot.colorId);
    }
  }

  dotHovered(dot) {
    if (this.state !== constants.GAME_STATE.RUNNING) return;

    // Only check a hovered dot if a selection has been started and the dot is adjacent to last selected dot.
    let selected = this.selection.selected;
    if ( selected.length === 0 || !this.dotGrid.checkAdjacent(dot, selected[selected.length-1]) ) return;
    
    // If this dot is unselected and has the same color as selection, add it to selection.
    if (
      selected.length > 0 
      && dot.state !== dotState.SELECTED 
      && dot.colorId === this.selection.colorId
      && this.dotGrid.checkAdjacent(dot, selected[selected.length-1])
      && !this.selection.loop
    ) {
      dot.setState(dotState.SELECTED);
      selected.push(dot);
      this.addDotEffect(dot.x, dot.y, dot.colorId);
    }
    // If this dot is the previously selected dot, undo the last selected dot.
    // This lets the player "undo" selections by backtracking.
    else if (selected.length > 1 && dot.name === selected[selected.length-2].name) {
      if (this.selection.loop) {
        this.selection.loop = false;
      }
      else {
        selected[selected.length-1].setState(dotState.NONE);
      }
      selected.pop();
      this.selection.loop = false;
    }
    // If this dot is the same as the first selected dot and enough dots are selected
    // for a loop, add it and set loop to true.
    else if (selected.length > MIN_LOOP_COUNT - 1 && dot === selected[0]) {
      selected.push(dot);
      this.selection.loop = true;
      this.addDotEffect(dot.x, dot.y, dot.colorId);
    }

    // Draw lines representing selected dots
    this.updateColorOverlay();
    this.updateSelectedLines();
  }

  pointerUp() {
    if (this.state !== constants.GAME_STATE.RUNNING) return;

    let selected = this.selection.selected;
    if (selected.length === 0) return;

    if (selected.length === 1) {
      selected[0].setState(dotState.NONE);
    }
    else if (this.selection.loop) {
      let numRemoved = this.dotGrid.removeAllDotsWithColorId(this.selection.colorId);
      this.points += numRemoved;
      this.selection.loop = false;
    }
    else {
      this.dotGrid.removeDots(selected);
      this.points += selected.length;
    }
    this.pointsDisplay.setText(this.points);
    this.selection.selected = [];
    this.updateColorOverlay();
    this.updateSelectedLines();
  }

  restart() {
    this.setState(constants.GAME_STATE.RUNNING);
  }

  exit() {
    this.scene.start(constants.SCENES.GAME);
  }

  // VISUALIZATION METHODS ========================================================================

  updateTimerDisplay() {
    if (this.state === constants.GAME_STATE.RUNNING) {
      // Update timer display
      if (this.endTime) {
        let timeLeft = this.endTime - this.time.now;
        let secondsLeft;
        if (this.time.now > this.endTime) {
          this.setState(constants.GAME_STATE.OVER);
          secondsLeft = 0;
        }
        else {
          secondsLeft = Math.floor(timeLeft/1000);
        }
        this.timerDisplay.text = secondsLeft;
      }
    }
  }

  updatePointerLine() {
    let selected = this.selection.selected;
    let graphics = this.pointerLineGraphics;
    graphics.clear();
    if (selected.length > 0 && !this.selection.loop) {
      graphics.lineStyle(5, constants.COLORS[this.selection.colorId]._color);
      graphics.beginPath();
      graphics.moveTo(selected[selected.length-1].x, selected[selected.length-1].y);
      graphics.lineTo(this.pointer.x, this.pointer.y);
      graphics.strokePath();
    }
  }

  updateSelectedLines() {
    let selected = this.selection.selected;
    let graphics = this.selectedLinesGraphics;
    graphics.clear();
    if (selected.length > 1) {
      graphics.lineStyle(5, constants.COLORS[this.selection.colorId]._color);
      graphics.beginPath();
      graphics.moveTo(selected[0].x, selected[0].y);
      for (let i = 1; i < selected.length; i++) {
        graphics.lineTo(selected[i].x, selected[i].y);
      }
      graphics.strokePath();
    }
  }

  // Color overlay turns on and changes to the selected color when you've made a loop.
  updateColorOverlay() {
    if (this.selection.loop) {
      this.colorOverlay.fillColor = constants.COLORS[this.selection.colorId]._color;
      this.colorOverlay.setVisible(true);
    }
    else {
      this.colorOverlay.setVisible(false);
    }
  }

  addDotEffect(x, y, colorId) {
    let dotEffect = this.dotEffectGroup.get(x, y);
    dotEffect.dotScale = this.dotGrid.dotScale;
    dotEffect.setColorId(colorId);
    dotEffect.spawn();
  }
}