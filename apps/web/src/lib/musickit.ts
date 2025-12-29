export const musicKitConfig = {
  developerToken: process.env.NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN || '',
  appName: 'Music Box',
  appBuild: '1.0.0',
};

export async function configureMusicKit(): Promise<MusicKit.MusicKitInstance | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    // Load MusicKit JS script if not already loaded
    if (!document.getElementById('musickit-script')) {
      const script = document.createElement('script');
      script.id = 'musickit-script';
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => initMusicKit(resolve);
      script.onerror = () => {
        console.error('Failed to load MusicKit JS');
        resolve(null);
      };
    } else if (window.MusicKit) {
      initMusicKit(resolve);
    } else {
      // Script exists but MusicKit not ready yet
      document.getElementById('musickit-script')!.addEventListener('load', () => {
        initMusicKit(resolve);
      });
    }
  });
}

function initMusicKit(
  resolve: (value: MusicKit.MusicKitInstance | null) => void
) {
  if (!window.MusicKit) {
    console.error('MusicKit not available');
    resolve(null);
    return;
  }

  window.MusicKit.configure({
    developerToken: musicKitConfig.developerToken,
    app: {
      name: musicKitConfig.appName,
      build: musicKitConfig.appBuild,
    },
  })
    .then((music) => {
      resolve(music);
    })
    .catch((error) => {
      console.error('Failed to configure MusicKit:', error);
      resolve(null);
    });
}

export async function authorizeMusicKit(): Promise<string | null> {
  if (!window.MusicKit) return null;

  try {
    const music = window.MusicKit.getInstance();
    const musicUserToken = await music.authorize();
    return musicUserToken;
  } catch (error) {
    console.error('Failed to authorize MusicKit:', error);
    return null;
  }
}

export async function unauthorizeMusicKit(): Promise<void> {
  if (!window.MusicKit) return;

  try {
    const music = window.MusicKit.getInstance();
    await music.unauthorize();
  } catch (error) {
    console.error('Failed to unauthorize MusicKit:', error);
  }
}
