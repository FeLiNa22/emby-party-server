import { Party } from "./Interfaces/Party";
import randomstring from "randomstring";

export class PartyManager {
  private parties: Map<string, Party>;
  
  constructor() {
    this.parties = new Map<string, Party>();
  }

  add(id: string, party: Party): void {
    this.parties.set(id, party);
  }

  get(id: string): Party | undefined {
    return this.parties.get(id);
  }

  remove(id: string): void {
    this.parties.delete(id);
  }

  partyExists(partyId: string): boolean {
    return this.parties.has(partyId);
  }

  generatePartyId(): string {
    const randOptions = {
      length: 6,
      charset: "alphabetic",
      capitalization: "uppercase",
    };

    // keeps looping until the randomly generated partyId is unique
    do {
      var partyId: string = randomstring.generate(randOptions);
    } while (this.partyExists(partyId));

    return partyId;
  }
}
