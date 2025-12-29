const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const musicKitConfig = {
  appName: 'Music Box',
  appBuild: '1.0.0',
};

let cachedDeveloperToken: string | null = null;

async function fetchDeveloperToken(): Promise<string> {
  if (cachedDeveloperToken) {
    return cachedDeveloperToken;
  }

  try {
    const response = await fetch(`${API_URL}/apple-music/token`);
    if (!response.ok) {
      throw new Error(`Failed to fetch developer token: ${response.status}`);
    }
    const data = await response.json();
    cachedDeveloperToken = data.token;
    return data.token;
  } catch (error) {
    console.error('Failed to fetch developer token:', error);
    throw error;
  }
}

export async function configureMusicKit(): Promise<MusicKit.MusicKitInstance | null> {
  if (typeof window === 'undefined') return null;

  // Fetch the developer token from the API
  let developerToken: string;
  try {
    developerToken = await fetchDeveloperToken();
  } catch (error) {
    console.error('Cannot configure MusicKit without developer token');
    return null;
  }

  return new Promise((resolve) => {
    // Load MusicKit JS script if not already loaded
    if (!document.getElementById('musickit-script')) {
      const script = document.createElement('script');
      script.id = 'musickit-script';
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => initMusicKit(developerToken, resolve);
      script.onerror = () => {
        console.error('Failed to load MusicKit JS');
        resolve(null);
      };
    } else if (window.MusicKit) {
      initMusicKit(developerToken, resolve);
    } else {
      // Script exists but MusicKit not ready yet
      document.getElementById('musickit-script')!.addEventListener('load', () => {
        initMusicKit(developerToken, resolve);
      });
    }
  });
}

function initMusicKit(
  developerToken: string,
  resolve: (value: MusicKit.MusicKitInstance | null) => void
) {
  if (!window.MusicKit) {
    console.error('MusicKit not available');
    resolve(null);
    return;
  }

  window.MusicKit.configure({
    developerToken,
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
