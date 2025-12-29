export type ButtonCallback = () => void;

// Dynamic import for libgpiod (only available on Pi)
let Chip: any;
let Line: any;
let available = false;

try {
  const gpiod = await import('node-libgpiod');
  Chip = gpiod.Chip;
  Line = gpiod.Line;
  available = true;
} catch {
  available = false;
}

export function isGpioAvailable(): boolean {
  return available;
}

export class Button {
  private line: any = null;
  private callback: ButtonCallback | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastValue: number = 1; // Pull-up, so 1 = not pressed
  private readonly debounceMs = 200;

  constructor(
    private readonly pin: number,
    private readonly name: string
  ) {}

  async initialize(callback: ButtonCallback): Promise<void> {
    this.callback = callback;

    if (!available) {
      console.warn(`GPIO not available - ${this.name} button will be simulated`);
      return;
    }

    try {
      // Open GPIO chip (gpiochip0 for Pi 4, gpiochip4 for Pi 5)
      const chip = new Chip(0);
      this.line = new Line(chip, this.pin);

      // Request line as input with pull-up
      this.line.requestInputMode();

      // Poll for button presses (libgpiod doesn't have native edge detection in Node)
      this.lastValue = this.line.getValue();
      this.pollInterval = setInterval(() => {
        const value = this.line.getValue();

        // Detect falling edge (button press with pull-up resistor)
        if (this.lastValue === 1 && value === 0) {
          // Debounce
          if (!this.debounceTimeout) {
            console.log(`${this.name} button pressed`);
            this.callback?.();

            this.debounceTimeout = setTimeout(() => {
              this.debounceTimeout = null;
            }, this.debounceMs);
          }
        }

        this.lastValue = value;
      }, 50); // Poll every 50ms

      console.log(`${this.name} button initialized on GPIO ${this.pin}`);
    } catch (error) {
      console.warn(`GPIO init failed for ${this.name} button (pin ${this.pin}): ${error instanceof Error ? error.message : error}`);
      console.warn(`${this.name} button will be simulated`);
      this.line = null;
    }
  }

  destroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.line) {
      this.line.release();
      this.line = null;
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
