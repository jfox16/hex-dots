import { TextDisplay } from './TextDisplay';

export class TimerDisplay extends TextDisplay {
  setTime(ms) {
    let s = Math.floor(ms / 1000);
    if (s < 0) s = 0;
    if (s !== this.currentTime) {
      this.text.setText(s);
      console.log('setTime!' + s);
      this.currentTime = s;
    }
  }
}