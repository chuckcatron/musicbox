import { spawn, ChildProcess } from 'child_process';

export type ButtonCallback = () => void;

let gpioAvailable: boolean | null = null;

export function isGpioAvailable(): boolean {
  if (gpioAvailable === null) {
    // Check if gpiomon command exists
    try {
      const { execSync } = require('child_process');
      execSync('which gpiomon', { stdio: 'ignore' });
      gpioAvailable = true;
    } catch {
      gpioAvailable = false;
    }
  }
  return gpioAvailable;
}

export class Button {
  private process: ChildProcess | null = null;
  private callback: ButtonCallback | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs = 200;

  constructor(
    private readonly pin: number,
    private readonly name: string
  ) {}

  async initialize(callback: ButtonCallback): Promise<void> {
    this.callback = callback;

    if (!isGpioAvailable()) {
      console.warn(`gpiomon not available - ${this.name} button will be simulated`);
      return;
    }

    try {
      // Use gpiomon to watch for falling edges on the GPIO pin
      // gpiochip0 for Pi 4, gpiochip4 for Pi 5
      const chip = await this.detectGpioChip();

      this.process = spawn('gpiomon', [
        '--falling-edge',
        '--chip', chip,
        String(this.pin)
      ]);

      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        // gpiomon outputs a line for each edge event
        if (output.includes('FALLING')) {
          this.handlePress();
        }
      });

      // Some versions of gpiomon output to stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('FALLING') || output.match(/\d+\s+falling/)) {
          this.handlePress();
        }
      });

      this.process.on('error', (error) => {
        console.error(`${this.name} button gpiomon error:`, error.message);
      });

      this.process.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.warn(`${this.name} button gpiomon exited with code ${code}`);
        }
      });

      console.log(`${this.name} button initialized on GPIO ${this.pin} (${chip})`);
    } catch (error) {
      console.warn(`GPIO init failed for ${this.name} button (pin ${this.pin}): ${error instanceof Error ? error.message : error}`);
      console.warn(`${this.name} button will be simulated`);
      this.process = null;
    }
  }

  private async detectGpioChip(): Promise<string> {
    // Try to detect the correct GPIO chip
    // Pi 4 uses gpiochip0, Pi 5 uses gpiochip4
    const { execSync } = require('child_process');
    try {
      // Check if gpiochip4 exists (Pi 5)
      execSync('test -e /dev/gpiochip4', { stdio: 'ignore' });
      return 'gpiochip4';
    } catch {
      return 'gpiochip0';
    }
  }

  private handlePress(): void {
    // Debounce
    if (this.debounceTimeout) return;

    this.debounceTimeout = setTimeout(() => {
      this.debounceTimeout = null;
    }, this.debounceMs);

    console.log(`${this.name} button pressed`);
    this.callback?.();
  }

  destroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.process) {
      this.process.kill();
      this.process = null;
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
