import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PartyManager } from "./PartyManager";
import { SocketParty } from "./SocketParty";
import { Message } from "./Interfaces/Message";
import { Member } from "./Interfaces/Member";
import { SocketMember } from "./SocketMember";
import { Video } from "./Interfaces/Video";
import { Party } from "./Interfaces/Party";

const apiPort = 5000;
const socketPort = 4000;

/* ------------------ WEBSOCKET ------------------ */

// Launch the localhost websocket server
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: [],
    credentials: false,
  },
});

/* ------------------ SETUP SUBSCRIBERS ------------------ */
const manager = new PartyManager();
// maps sid -> member
const members = new Map<string, Member>();

// socket event handling
io.on("connection", (socket: Socket) => {
  // every member must authorise before they are able to use
  // any other function
  socket.on("member:authorise", (callback) => {
    // check member not already authorised
    if (members.has(socket.id)) {
      callback({ error: "You have already authorised" });
    } else {
      // create a member entry for user when they authorise
      var member: Member = new SocketMember(socket);
      // create entry for member
      members.set(socket.id, member);
      // send member entry back to client
      callback(member);
    }
  });

  // whenever we receive a create party request we create a party
  socket.on("party:create", (callback) => {
    // gets the member object for the user
    var member = members.get(socket.id);
    var party: Party | undefined;
    if (member !== undefined) {
      // generate unique party id
      var partyId: string = manager.generatePartyId();
      // create the party
      party = new SocketParty(io, partyId);
      // add party to list of parties
      manager.add(partyId, party);
      // join the party
      party.addMember(member);
      // return the partyId to the user who created it
      callback(party);
    }
    callback({ error: "Could not create party" });
  });

  // whenever we receive a join party request we try to join a party
  socket.on("party:join", (partyId: string, callback) => {
    // gets the member object for the user
    var member: Member | undefined = members.get(socket.id);
    // get the party
    var party: Party | undefined = manager.get(partyId);
    if (party === undefined) {
      // check the party exists
      callback({ error: "Party doesn't exist", code: 100 });
    } else if (member === undefined) {
      // check the member exists
      callback({ error: "Member doesn't exist", code: 200 });
    } else {
      //join the party
      party.addMember(member);
      // return the party
      callback(party);
    }
  });

  // leave a party
  socket.on("party:leave", (partyId: string, callback) => {
    // gets the member object for the user
    var member: Member | undefined = members.get(socket.id);
    // get the party
    var party: Party | undefined = manager.get(partyId);
    if (party === undefined) {
      // check the party exists
      callback({ error: "Party doesn't exist", code: 100 });
    } else if (member === undefined) {
      // check the member exists
      callback({ error: "Member doesn't exist", code: 200 });
    } else {
      //leave the party
      party.removeMember(member);
      // if no one is left in the party rthen remove it
      if (!socket.rooms.has(party.id)) {
        manager.remove(party.id);
      }
      // return true
      callback(true);
    }
  });

  // check to see if party exists
  socket.on("party:exists", (partyId: string, callback) => {
    callback(manager.partyExists(partyId));
  });

  // broadcast a message to the party
  socket.on("chat:broadcast", (partyId: string, message: Message) => {
    // gets the member object for the user
    var member: Member | undefined = members.get(socket.id);
    // gets the party user is sending message to
    var party: Party | undefined = manager.get(partyId);
    if (member !== undefined && party !== undefined) {
      // broadcast the message
      party.broadcast(member, message);
    }
  });

  // send a message directly to a member in the party
  socket.on(
    "chat:whisper",
    (partyId: string, message: Message, memberId: string) => {
      // gets the from and to of the user ids
      var from: Member | undefined = members.get(socket.id);
      var to: Member | undefined = members.get(memberId);
      // gets the party user is sending message to
      var party: Party | undefined = manager.get(partyId);
      if (from !== undefined && to !== undefined && party !== undefined) {
        // whisper the message
        party.whisper(from, message, to);
      }
    }
  );

  // delete a message for everyone in party
  socket.on("chat:delete", (partyId: string, message: Message) => {
    // gets the member object for the user
    var member: Member | undefined = members.get(socket.id);
    // gets the party user is deleting message from
    var party: Party | undefined = manager.get(partyId);
    if (member !== undefined && party !== undefined) {
      // whisper the message
      party.delete(member, message);
    }
  });

  // update video that party is watching
  socket.on("video:update", (partyId: string, video: Video) => {
    // gets the party
    var party: Party | undefined = manager.get(partyId);
    if (party !== undefined) {
      // update video for all party members
      party.updateVideo(video);
    }
  });

  // on disconnecting
  socket.on("disconnecting", (reason) => {
    // gets the member object for the user
    var member = members.get(socket.id);
    if (member !== undefined) {
      for (var room of socket.rooms) {
        // on user leaving room
        var party: Party | undefined = manager.get(room);
        if (party !== undefined) {
          party.removeMember(member);
          if (party.isEmpty()) {
            // on room deleted
            manager.remove(room);
          }
        }
      }
      // delete member object
      members.delete(member.id);
    }
  });

  socket.on("disconnect", (reason) => {
    members.delete(socket.id);
    console.log(socket.id + " disconnected " + reason);
  });
});

/* ------------------ API ------------------ */

// Launch the localhost API that will display stats of parties and get video url
const api = express();
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

interface stats {
  total_parties: number;
  total_users: number;
  active_users: number;
  active_parties: number;
  active_watch_time: number;
}

/* Gets all the statistics of the entire server */
api.get("/stats", (req, res) => {
  res.send(members);
});

/* Gets all the statistics of the specific party */
api.get("/stats/:partyId", (req, res) => {
  var party = manager.get(req.params.partyId || "");
  if (party !== undefined) {
    res.json(party);
  } else {
    res.send({ error: "party requested could not be found" });
  }
});

// start api server
api.listen(apiPort, () => {
  console.log(`api running on port ${apiPort}`);
});

// start socket server
httpServer.listen(socketPort, function () {
  console.log(`web socket running on port ${socketPort}`);
});
