import { Socket } from "socket.io";
import { Member } from "./Interfaces/Member";
import { Party } from "./Interfaces/Party";
import { SocketMessage } from "./SocketMessage";

export class SocketMember implements Member {
  id: string;
  name: string;
  private socket: Socket;

  constructor(socket: Socket) {
    this.id = socket.id;
    this.name = this.id.substring(0, 6);
    this.socket = socket;
    console.log("socket member established " + this.id);
  }

  toJSON() {
    const {id, name} = this;
    return {id, name};
  }

  join(party: Party) {
    this.socket.join(party.id);
  }

  leave(party: Party): void {
    this.socket.leave(party.id);
  }

  setName(name: string, party: Party): void {
    party.alert(new SocketMessage(this.name + " changed their name to" + name));
    this.name = name;
  }

  update(party: Party): void {
    throw new Error("This shouldn't be called for any sockets");
  }
}
