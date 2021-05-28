export interface Video {
  src: string;
  timestamp: number;
  playbackRate: number;
  paused: boolean;
  played: boolean;
  seeking: boolean;
  subtitles: Array<string>;
}
