import { config, validateConfig } from './config.js';
import { ApiClient } from './api-client.js';
import { Player } from './player.js';
import { Button, simulateButtonPress } from './button.js';
import { Gpio } from 'onoff';

async function main(): Promise<void> {
  console.log('Music Box Pi Client starting...');

  // Validate configuration
  validateConfig();

  const apiClient = new ApiClient();
  const player = new Player();

  // Button handlers
  const handlePlayPress = async (): Promise<void> => {
    try {
      console.log('Fetching random song...');
      const song = await apiClient.getRandomSong();

      console.log(`Got song: ${song.name} by ${song.artist}`);

      await player.play(song.streamUrl, {
        name: song.name,
        artist: song.artist,
      });
    } catch (error) {
      console.error('Error playing song:', error instanceof Error ? error.message : error);
    }
  };

  const handleStopPress = (): void => {
    player.stop();
  };

  // Initialize buttons
  const playButton = new Button(config.gpio.playButton, 'Play');
  const stopButton = new Button(config.gpio.stopButton, 'Stop');

  await playButton.initialize(handlePlayPress);
  await stopButton.initialize(handleStopPress);

  // Setup keyboard simulation for development
  if (!Gpio.accessible) {
    console.log('\nRunning in simulation mode (no GPIO)');
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (data) => {
        const key = data.toString().toLowerCase();
        switch (key) {
          case 'p':
            console.log('Simulated play button press');
            handlePlayPress();
            break;
          case 's':
            console.log('Simulated stop button press');
            handleStopPress();
            break;
          case 'q':
          case '\u0003': // Ctrl+C
            cleanup();
            process.exit(0);
        }
      });
      console.log('Press P to play, S to stop, Q to quit\n');
    }
  }

  // Cleanup on exit
  const cleanup = (): void => {
    console.log('\nCleaning up...');
    player.stop();
    playButton.destroy();
    stopButton.destroy();
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  console.log('Music Box Pi Client ready!');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`User ID: ${config.userId}`);
  console.log(`Play button: GPIO ${config.gpio.playButton}`);
  console.log(`Stop button: GPIO ${config.gpio.stopButton}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
