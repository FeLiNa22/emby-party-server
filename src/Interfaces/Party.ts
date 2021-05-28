import { idText } from "typescript";
import { Member } from "./Member";
import { Message } from "./Message";
import { Video } from "./Video";

export interface Party {
  id: string;
  name : string;
  notifyMember(member: Member, ...data: any): void;
  notifyAll(...data: any): void;
  addMember(member: Member): void;
  removeMember(member: Member): void;
  updateVideo(video: Video): void;
  alert(message: Message): void;
  whisper(from: Member, message: Message, to: Member): void;
  broadcast(user: Member, message: Message): void;
  delete(user: Member, message: Message): void;
  isEmpty() : boolean;
  toJSON() : any;
}
