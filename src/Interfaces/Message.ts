export interface Message {
  id : string;
  toText(): string;
  getDate(): Date;
  toJSON() : any;
}