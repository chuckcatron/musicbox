import { spawn, type ChildProcess } from 'child_process';
import { config } from './config.js';

export class Player {
  private process: ChildProcess | null = null;
  private currentSong: { name: string; artist: string } | null = null;

  get isPlaying(): boolean {
    return this.process !== null;
  }

  get nowPlaying(): { name: string; artist: string } | null {
    return this.currentSong;
  }

  async play(streamUrl: string, songInfo?: { name: string; artist: string }): Promise<void> {
    // Stop any current playback
    this.stop();

    console.log(`Playing: ${songInfo?.name || 'Unknown'} by ${songInfo?.artist || 'Unknown'}`);

    this.currentSong = songInfo || null;

    return new Promise((resolve, reject) => {
      this.process = spawn(config.player.command, [
        ...config.player.args,
        streamUrl,
      ]);

      this.process.on('error', (error) => {
        console.error('Player error:', error.message);
        this.cleanup();
        reject(error);
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`Player exited with code ${code}`);
        }
        this.cleanup();
        resolve();
      });

      // Resolve immediately after spawning - playback runs async
      resolve();
    });
  }

  stop(): void {
    if (this.process) {
      console.log('Stopping playback');
      this.process.kill('SIGTERM');
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.process = null;
    this.currentSong = null;
  }
}
