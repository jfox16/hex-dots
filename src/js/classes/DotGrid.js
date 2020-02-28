import { Dot } from './Dot';

/**
 * DotGrid is a class that represents a hexagonal grid of dots.
 */
export class DotGrid {
  /**
   * Creates a new DotGrid, initializes its grid, and layout using input values.
   * @param {Phaser.Scene} scene - The scene that this belongs to
   * @param {number} numRows - The number of rows in the grid
   * @param {number} numColumns - The number of columns in the grid
   * @param {number} numColors - The number of colors to randomize dots with
   * @param {number} centerX - The center x position of the grid in world position
   * @param {number} centerY - The center y position of the grid in world position
   * @param {number} maxWidth - The maximum width that the grid can expand to
   * @param {number} maxHeight - The maximum height that the grid can expand to
   */
  constructor(scene, numRows, numColumns, numColors, centerX, centerY, maxWidth, maxHeight) {
    this.scene = scene;
    this.numRows = numRows;
    this.numColumns = numColumns;
    this.numColors = numColors;
    
    // Set ratio to lay out cells in even hexagonal spacing.
    let widthToHeightRatio = (this.numColumns + 0.5) / (this.numRows * Math.cos(Math.PI/6));

    // We want to fit the grid inside maxWidth and maxHeight, but we need to first check
    // whether to scale by width or by height.
    if (widthToHeightRatio > maxWidth / maxHeight)  {
      // This means the grid is wider than than max dimensions, so scale by width.
      this.width  = maxWidth;
      this.height = maxWidth / widthToHeightRatio;
    }
    else {
      // This means the grid is taller than max dimensions, so scale by height.
      this.width  = maxHeight * widthToHeightRatio;
      this.height = maxHeight;
    }

    this.cellDistanceX = this.width / (this.numColumns + 0.5);
    this.cellDistanceY = this.height / this.numRows;
    this.dotScale = 0.8 * this.cellDistanceX / 128;


    // Initialize grid cells
    this.grid = new Array(this.numRows);

    for (let r = 0; r < this.numRows; r++) {
      this.grid[r] = new Array(this.numColumns);

      for (let c = 0; c < this.numColumns; c++) {

        // Find the world position for this cell in the hexagonal grid layout
        let cellX = centerX - this.width/2 + this.cellDistanceX * (c + 0.5);
        let cellY = centerY - this.height/2 + this.cellDistanceY * (r + 0.5);

        if (r % 2 === 1)
          cellX += this.cellDistanceX/2; // offset odd rows

        this.grid[r][c] = {
          x: cellX,
          y: cellY,
          dot: null
        };
      }
    }

    // Initialize dot group (for object pooling)
    this.dotGroup = scene.add.group({
      defaultKey: 'dot',
      maxSize: numRows * numColumns * 2,
      classType: Dot,
      createCallback: (dot) => {
        dot.setName('dot' + this.dotGroup.getLength());
        dot.group = this.dotGroup;
        dot.dotScale = this.dotScale;
      
        dot.on('pointerdown', () => {
          scene.dotClicked(dot);
        });
  
        dot.on('pointerover', () => {
          scene.dotHovered(dot);
        });
      }
    });
  }

  // Add a new randomized dot to every cell in the grid, removing old dots.
  fillWithRandomDots() {
    // reset colorBuckets
    this.colorBuckets = new Array(this.numColors);
    for (let i = 0; i < this.colorBuckets.length; i++) {
      this.colorBuckets[i] = [];
    }
    // remove old dots and replace with a new dot with random color
    this.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.dot !== null) {
          this.dotGroup.killAndHide(cell.dot);
          cell.dot = null;
        }
        let dot = this.addNewDot(cell.x, cell.y);
        dot.setGridPosition(r, c);
        this.grid[r][c].dot = dot;
      });
    });
  }

  // Adds a new dot at world position (x, y). Returns the new dot, or null if no dot was available.
  addNewDot(x, y) {
    let dot = this.dotGroup.get(x, y);
    if (!dot) {
      console.error("No dots available!");
      return null;
    }

    // Add to matching color bucket
    dot.setColorId(Math.floor(Math.random() * this.numColors));
    dot.indexInColorBucket = this.colorBuckets[dot.colorId].push(dot) - 1;
    dot.spawn();
    return dot;
  }

  // Removes an array of dots from the grid and moves remaining dots downwards to fill the gaps.
  // Also properly updates dotBuckets. Optimized for removing multiple dots at a time.
  removeDots(dots) {
    if (dots.length === 0) return;

    let colorId = dots[0].colorId;

    let columnLowestRowChanged = {};

    // Remove dots and leave nulls where they were referenced
    dots.forEach((dot) => {
      if (columnLowestRowChanged[dot.column] === undefined || columnLowestRowChanged[dot.column] < dot.row) {
        columnLowestRowChanged[dot.column] = dot.row;
      }
      this.colorBuckets[dot.colorId][dot.indexInColorBucket] = null;
      this.grid[dot.row][dot.column].dot = null;
      dot.despawn();
    });

    // Move dots downwards.
    Object.keys(columnLowestRowChanged).forEach((column) => {
      let lowestRowChanged = columnLowestRowChanged[column];
      column = Number(column);
      let remainingDots = [];

      for (let row = 0; row <= lowestRowChanged; row++) {
        let dot = this.grid[row][column].dot;
        if (dot) {
          remainingDots.push(dot);
        }
      }

      for (let row = lowestRowChanged; row >= 0; row--) {
        let cell = this.grid[row][column];
        if (remainingDots.length > 0) {
          let dot = remainingDots.pop();
          this.moveDotToRow(dot, dot.row, row);
          dot.setGridPosition(row, column);
          cell.dot = dot;
        }
        else {
          cell.dot = null;
        }
      }
    });

    // Remove nulls from color buckets
    let colorBucket = this.colorBuckets[colorId];
    let numDots = 0;

    for (let i = 0; i < colorBucket.length; i++) {
      if (colorBucket[i] !== null) {
        colorBucket[numDots] = colorBucket[i];
        colorBucket[numDots].indexInColorBucket = numDots;
        numDots++;
      }
    }

    // Remove the nulls from the end
    this.colorBuckets[colorId] = colorBucket.slice(0, numDots);


    // REPLACE REMOVED CELLS ======================================================================

    this.grid.forEach((row, r) => {
      let delay = 300 + (r / this.numRows) * 700;
      this.scene.time.delayedCall(delay, () => {
        row.forEach((cell, c) => {
          if (cell.dot === null) {
            cell.dot = this.addNewDot(cell.x, cell.y);
            cell.dot.setGridPosition(r, c);
          }
        });
      }, []);
    });
  }

  removeAllDotsWithColorId(colorId) {
    let colorBucket = this.colorBuckets[colorId];
    let numRemoved = colorBucket.length;
    this.removeDots(colorBucket);
    return numRemoved;
  }

  // Returns true if these dots are next to each other on the hex grid
  checkAdjacent(dot1, dot2) {
    let rowDiff = Math.abs(dot1.row - dot2.row);
    let columnDiff = Math.abs(dot1.column - dot2.column);

    if (rowDiff + columnDiff === 1)
      return true;

    if (dot1.row % 2 === 0) {
      if (dot2.column === dot1.column - 1 && rowDiff === 1)
        return true;
    }
    else {
      if (dot2.column === dot1.column + 1 && rowDiff === 1)
        return true;
    }

    return false;
  }

  // Uses a curve and tween to animate the dot moving down to a new row.
  moveDotToRow(dot, originalRow, targetRow) {
    let points = [];
    let c = dot.column;
    for (let r = originalRow; r <= targetRow; r++) {
      points.push(this.grid[r][c].x);
      points.push(this.grid[r][c].y);
    }

    let path = new Phaser.Curves.Path(this.grid[originalRow][c].x, this.grid[originalRow][c].y);
    path.splineTo(points);
    dot.startFall(path);
  }

  // Draw curves on the scene to separate columns.
  drawColumnLines() {
    let baseX = this.grid[0][0].x;
    let baseY = this.grid[0][0].y;
    
    // This gets the points for one curve.
    let points = [];
    for (let r = 0; r < this.numRows; r++) {
      points.push(this.grid[r][0].x - this.cellDistanceX/2 - baseX);
      points.push(this.grid[r][0].y - baseY);
    }

    // Draw that curve once for each column.
    let curve = new Phaser.Curves.Spline(points);
    for (let c = 0; c < this.numColumns+1; c++) {
      let graphics = this.scene.add.graphics({
        x: baseX + c * this.cellDistanceX,
        y: baseY
      });
      graphics.setDepth(-9);
      graphics.lineStyle(8, 0x333333);
      curve.draw(graphics, (this.numRows-1) * 8);
    }
  }
}