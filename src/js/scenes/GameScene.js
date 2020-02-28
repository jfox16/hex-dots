import { constants } from "../constants";
import { UiHandler } from '../classes/UiHandler';
import { DotGrid } from '../classes/DotGrid';
import { DOT_STATE, DOT_COLORS } from '../classes/Dot';
import { DotEffect } from "../classes/DotEffect";

export const GAME_STATE = {
  START: 0,
  RUNNING: 1,
  OVER: 2
}

export const GAME_CONSTANTS = {
  NUM_ROWS:  6,
  NUM_COLUMNS: 8,
  NUM_COLORS: 7,
  MIN_LOOP_COUNT: 3,
  ROUND_TIME: 60000
}

/**
 * GameScene is the scene for the main game. Operates using 3 states: Start, Running, and Over
 */
export class GameScene extends Phaser.Scene {
  
  constructor() {  
    super({
      key: constants.SCENES.GAME
    });
  }

  // PHASER SCENE METHODS =========================================================================

  preload() {
    this.canvas = this.sys.game.canvas;
    this.pointer = this.input.activePointer;
    this.input.on('pointerup', () => this.pointerUp());
    this.points = 0;

    // Initialize dot grid
    this.dotGrid = new DotGrid(
      this, 
      GAME_CONSTANTS.NUM_ROWS, 
      GAME_CONSTANTS.NUM_COLUMNS, 
      GAME_CONSTANTS.NUM_COLORS, 
      this.canvas.width/2, 
      this.canvas.height/2 + 50, 
      750, 
      500
    );

    // Initialize selection to keep track of currently selected dots
    this.selection = {
      selected: [],
      colorId: 0,
      loop: false
    };

    // Make a group for object-pooling dot effects
    this.dotEffectGroup = this.add.group({
      defaultKey: 'dotEffect',
      maxSize: GAME_CONSTANTS.NUM_ROWS * GAME_CONSTANTS.NUM_COLUMNS,
      classType: DotEffect,
      createCallback: (dotEffect) => {
        dotEffect.setName('dotEffect' + this.dotEffectGroup.getLength());
        dotEffect.group = this.dotEffectGroup;
      }
    });
  }

  create() {
    // Add Background
    this.add.image(0, 0, "gradient-bg").setOrigin(0,0).setDepth(-10);

    // Line graphics
    this.selectedLinesGraphics = this.add.graphics();
    this.selectedLinesGraphics.setDepth(-1);
    this.pointerLineGraphics = this.add.graphics();
    this.pointerLineGraphics.setDepth(-1);

    // Dot Grid
    this.dotGrid.drawColumnLines();
    this.dotGrid.fillWithRandomDots();

    // UI Handler
    this.uiHandler = new UiHandler(this, this.canvas);
    this.setState(GAME_STATE.START);
  }

  update() {
    this.dotGrid.dotGroup.children.iterate(dot => dot.update());
    this.updatePointerLine();
    this.updateTimerDisplay();
  }

  // MAIN METHODS =================================================================================

  setState(state) {
    this.uiHandler.changeState(this.state, state);
    this.state = state;

    switch(state) {
      case GAME_STATE.RUNNING:
        this.dotGrid.fillWithRandomDots();
        this.endTime = this.time.now + GAME_CONSTANTS.ROUND_TIME + 900;
        this.points = 0;
        this.updateColorOverlay();
        break;

      case GAME_STATE.OVER:
        this.uiHandler.yourScore.setText("Your Score: " + this.points);
        this.pointerUp();
        this.selection.selected = [];
        this.selection.loop = false;
        this.updateSelectedLines();
        this.updatePointerLine();
        this.updateColorOverlay();
        break;
    }
  }

  dotClicked(dot) {
    if (this.state !== GAME_STATE.RUNNING) return;

    let selected = this.selection.selected;
    if (selected.length === 0) {
      dot.setState(DOT_STATE.SELECTED);
      selected.push(dot);
      this.selection.colorId = dot.colorId;
      this.addDotEffect(dot.x, dot.y, dot.colorId);
    }
  }

  dotHovered(dot) {
    if (this.state !== GAME_STATE.RUNNING) return;

    // Only check a hovered dot if a selection has been started and the dot is adjacent to last selected dot.
    let selected = this.selection.selected;
    if ( selected.length === 0 || !this.dotGrid.checkAdjacent(dot, selected[selected.length-1]) ) return;
    
    // If this dot is unselected and has the same color as selection, add it to selection.
    if (
      selected.length > 0 
      && dot.state !== DOT_STATE.SELECTED 
      && dot.colorId === this.selection.colorId
      && this.dotGrid.checkAdjacent(dot, selected[selected.length-1])
      && !this.selection.loop
    ) {
      dot.setState(DOT_STATE.SELECTED);
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
        selected[selected.length-1].setState(DOT_STATE.NONE);
      }
      selected.pop();
      this.selection.loop = false;
    }
    // If this dot is the same as the first selected dot and enough dots are selected
    // for a loop, add it and set loop to true.
    else if (selected.length > GAME_CONSTANTS.MIN_LOOP_COUNT - 1 && dot === selected[0]) {
      selected.push(dot);
      this.selection.loop = true;
      this.addDotEffect(dot.x, dot.y, dot.colorId);
    }

    // Update visualizations that could have changed
    this.updateColorOverlay();
    this.updateSelectedLines();
  }

  pointerUp() {
    if (this.state !== GAME_STATE.RUNNING) return;

    let selected = this.selection.selected;
    if (selected.length === 0) return;

    if (selected.length === 1) {
      selected[0].setState(DOT_STATE.NONE);
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
    this.uiHandler.pointsDisplay.setText(this.points);
    this.selection.selected = [];
    this.updateColorOverlay();
    this.updateSelectedLines();
  }

  restart() {
    this.setState(GAME_STATE.RUNNING);
  }

  exit() {
    this.scene.start(constants.SCENES.GAME);
  }

  // VISUALIZATION METHODS ========================================================================

  updateTimerDisplay() {
    if (this.state === GAME_STATE.RUNNING) {
      // Update timer display
      if (this.endTime) {
        let timeLeft = this.endTime - this.time.now;
        let secondsLeft;
        if (this.time.now > this.endTime) {
          this.setState(GAME_STATE.OVER);
          secondsLeft = 0;
        }
        else {
          secondsLeft = Math.floor(timeLeft/1000);
        }
        this.uiHandler.timerDisplay.text = secondsLeft;
      }
    }
  }

  updatePointerLine() {
    let graphics = this.pointerLineGraphics;
    graphics.clear();

    let selected = this.selection.selected;
    if ( selected.length === 0 || this.selection.loop ) return;
    if ( this.pointer.x === 0 || this.pointer.y === 0 ) return; // fix for mobile

    if (selected.length > 0 && !this.selection.loop) {
      graphics.lineStyle(5, DOT_COLORS[this.selection.colorId]._color);
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
      graphics.lineStyle(5, DOT_COLORS[this.selection.colorId]._color);
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
    let colorOverlay = this.uiHandler.colorOverlay;
    if (this.selection.loop) {
      colorOverlay.fillColor = DOT_COLORS[this.selection.colorId]._color;
      colorOverlay.setVisible(true);
    }
    else {
      colorOverlay.setVisible(false);
    }
  }

  addDotEffect(x, y, colorId) {
    let dotEffect = this.dotEffectGroup.get(x, y);
    if (!dotEffect) {
      console.error("No DotEffect available!");
      return null;
    }
    dotEffect.dotScale = this.dotGrid.dotScale;
    dotEffect.setColorId(colorId);
    dotEffect.spawn();
  }
}