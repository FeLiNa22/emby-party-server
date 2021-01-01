export class Party {
    id: string;
    partyName: string;
    total_members: number;

    constructor(id: string) {
        this.id = id;
        this.partyName = "";
        this.total_members = 1;
    }
}