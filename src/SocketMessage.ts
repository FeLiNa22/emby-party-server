import { Message } from "./Interfaces/Message";

export class SocketMessage implements Message {
  static idGen: number = 0;
  
  id: string;
  text: string;
  date: Date;

  constructor(text: string) {
    this.text = text;
    this.id = SocketMessage.idGen.toString();
    SocketMessage.idGen++; // incr id generator
    this.date = new Date();
  }

  toJSON() {
    const {id, text, date} = this;
    return {id, text, date};
  }

  getDate(): Date {
    return this.date;
  }

  toText(): string {
    return this.text;
  }
}
