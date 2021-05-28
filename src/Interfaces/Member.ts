import { Party } from "./Party";

export interface Member {
  id: string;
  update(party: Party): void;
  setName(name: string, party: Party): void;
  join(party: Party): void;
  leave(party: Party): void;
  toJSON() : any;
}
