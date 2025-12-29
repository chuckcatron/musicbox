import { Gpio } from 'onoff';

export type ButtonCallback = () => void;

export class Button {
  private gpio: Gpio | null = null;
  private callback: ButtonCallback | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs = 200;

  constructor(
    private readonly pin: number,
    private readonly name: string
  ) {}

  async initialize(callback: ButtonCallback): Promise<void> {
    this.callback = callback;

    // Check if GPIO is available (running on Pi)
    if (!Gpio.accessible) {
      console.warn(`GPIO not accessible - ${this.name} button will be simulated`);
      return;
    }

    this.gpio = new Gpio(this.pin, 'in', 'falling', { debounceTimeout: 10 });

    this.gpio.watch((err, value) => {
      if (err) {
        console.error(`${this.name} button error:`, err);
        return;
      }

      // Debounce additional presses
      if (this.debounceTimeout) return;

      this.debounceTimeout = setTimeout(() => {
        this.debounceTimeout = null;
      }, this.debounceMs);

      console.log(`${this.name} button pressed`);
      this.callback?.();
    });

    console.log(`${this.name} button initialized on GPIO ${this.pin}`);
  }

  destroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.gpio) {
      this.gpio.unexport();
      this.gpio = null;
    }
  }
}

// For development/testing without GPIO
export function simulateButtonPress(callback: ButtonCallback): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data) => {
      const key = data.toString();
      if (key === 'p' || key === 'P') {
        console.log('Simulated play button press');
        callback();
      }
      if (key === 's' || key === 'S') {
        console.log('Simulated stop button press');
        // Stop is handled separately
      }
      if (key === 'q' || key === 'Q' || key === '\u0003') {
        console.log('Exiting...');
        process.exit(0);
      }
    });
    console.log('Press P to play, S to stop, Q to quit');
  }
}
