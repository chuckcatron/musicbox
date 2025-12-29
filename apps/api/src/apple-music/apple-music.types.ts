export interface AppleMusicPreview {
  url: string;
  hlsUrl?: string;
}

export interface AppleMusicArtwork {
  width: number;
  height: number;
  url: string;
  bgColor?: string;
  textColor1?: string;
  textColor2?: string;
  textColor3?: string;
  textColor4?: string;
}

export interface AppleMusicAttributes {
  name: string;
  artistName: string;
  albumName: string;
  durationInMillis: number;
  artwork: AppleMusicArtwork;
  previews: AppleMusicPreview[];
  url: string;
  genreNames: string[];
  releaseDate: string;
  trackNumber: number;
  discNumber: number;
  isrc: string;
}

export interface AppleMusicSong {
  id: string;
  type: 'songs';
  href: string;
  attributes: AppleMusicAttributes;
}

export interface AppleMusicSongResponse {
  data: AppleMusicSong[];
}
