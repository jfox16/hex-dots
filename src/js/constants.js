const Color = Phaser.Display.Color;

export const constants = {
  SCENES: {
    LOAD: 'LOAD',
    GAME: 'GAME'
  },
  GAME_STATE: {
    START: 0,
    RUNNING: 1,
    OVER: 2
  },
  COLORS: [
    Color.HSLToColor(0.00, 0.85, 0.60),  // Red
    Color.HSLToColor(0.62, 0.95, 0.60),  // Blue
    Color.HSLToColor(0.14, 0.85, 0.60),  // Yellow
    Color.HSLToColor(0.83, 0.85, 0.70),  // Pink
    Color.HSLToColor(0.27, 0.95, 0.65),  // Green
    Color.HSLToColor(0.08, 0.85, 0.60),  // Orange
    Color.HSLToColor(0.73, 0.85, 0.60),  // Purple
    Color.HSLToColor(0.47, 0.85, 0.50)   // Cyan
  ]
}