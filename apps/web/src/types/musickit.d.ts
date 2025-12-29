declare namespace MusicKit {
  interface MusicKitInstance {
    authorize(): Promise<string>;
    unauthorize(): Promise<void>;
    isAuthorized: boolean;
    musicUserToken: string;
    api: {
      music(path: string, options?: Record<string, unknown>): Promise<{
        data: {
          results: {
            songs?: {
              data: Array<{
                id: string;
                type: string;
                attributes: {
                  name: string;
                  artistName: string;
                  albumName: string;
                  durationInMillis: number;
                  artwork: {
                    url: string;
                    width: number;
                    height: number;
                  };
                  previews?: Array<{
                    url: string;
                  }>;
                };
              }>;
            };
          };
        };
      }>;
    };
  }

  interface ConfigureOptions {
    developerToken: string;
    app: {
      name: string;
      build: string;
    };
  }

  function configure(options: ConfigureOptions): Promise<MusicKitInstance>;
  function getInstance(): MusicKitInstance;
}

interface Window {
  MusicKit?: typeof MusicKit;
}
