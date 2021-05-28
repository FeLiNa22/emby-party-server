import { Video } from "./Interfaces/Video";

export class EmbyVideo implements Video{
    timestamp: number;
    subtitles: string;
    private isPlaying: boolean;
    private url : string;
    
    constructor(url: string){
        this.timestamp = 0;
        this.subtitles = "";
        this.isPlaying = false;

        this.url = url;
    }

    pause(): void {
        this.isPlaying = false;
    }

    play(): void {
      this.isPlaying = true;
    }

    forwardBy(seconds: number): void {
        throw new Error("Method not implemented.");
    }
    
    rewindBy(seconds: number): void {
        throw new Error("Method not implemented.");
    }
}