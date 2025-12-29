export const config = {
  // API Configuration
  apiUrl: process.env.MUSIC_BOX_API_URL || 'http://localhost:3001',
  apiKey: process.env.MUSIC_BOX_API_KEY || '',
  userId: process.env.MUSIC_BOX_USER_ID || '',

  // GPIO Pin Configuration
  gpio: {
    playButton: parseInt(process.env.GPIO_PLAY_BUTTON || '17', 10),
    stopButton: parseInt(process.env.GPIO_STOP_BUTTON || '27', 10),
  },

  // Player Configuration
  player: {
    command: process.env.PLAYER_COMMAND || 'mpv',
    args: ['--no-video', '--really-quiet'],
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('MUSIC_BOX_API_KEY is required');
  }

  if (!config.userId) {
    errors.push('MUSIC_BOX_USER_ID is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
}
