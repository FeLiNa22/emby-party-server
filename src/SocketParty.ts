import { Server } from "socket.io";
import { Member } from "./Interfaces/Member";
import { Message } from "./Interfaces/Message";
import { Party } from "./Interfaces/Party";
import { Video } from "./Interfaces/Video";

export class SocketParty implements Party {
  id: string;
  name: string;
  private video: Video | null;
  private members: Set<Member>;

  private server: Server;

  constructor(server: Server, id: string) {
    this.id = id;
    this.name = "unknown";
    this.server = server;
    this.video = null;
    this.members = new Set<Member>();
  }

  isEmpty(): boolean {
    return this.members.size === 0;
  }

  toJSON(): any {
    const { id, name, video, members } = this;
    return { id, name, video,  members : Array.from(members)};
  }

  whisper(from: Member, message: Message, to: Member): void {
    this.notifyMember(to, "chat:whisper", this, from, message);
  }

  broadcast(user: Member, message: Message): void {
    this.notifyAll("chat:broadcast", this, user, message);
  }

  alert(message: Message): void {
    this.notifyAll("chat:alert", this, message);
  }

  delete(user: Member, message: Message): void {
    this.notifyAll("chat:delete", this, user, message);
  }

  notifyMember(member: Member, event:string, ...data: any): void {
    this.server.to(member.id).emit(event, ...data);
  }

  notifyAll(event: string, ...data: any): void {
    this.server.to(this.id).emit(event, ...data);
  }

  addMember(member: Member): void {
    this.members.add(member);
    member.join(this);
    this.notifyAll("party:user-joined", this, member);
  }

  removeMember(member: Member): void {
    this.notifyAll("party:user-left", this, member);
    member.leave(this);
    this.members.delete(member);
  }

  updateVideo(video: Video): void {
    this.video = video;
    this.notifyAll("video:update", this, video);
  }
}
