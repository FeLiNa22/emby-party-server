import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import randomstring from "randomstring";
import { Party } from "./Party";
import { User } from "./User";
import { runInNewContext } from "vm";

const apiPort = 5000;
const socketPort = 4000;

/* MESSAGES */
const PARTY_JOIN_ERROR = "The code entered is invalid. Try again.";
const DEFAULT_ERROR = "Oops Something went wrong.";

// maps partyId -> video url
const parties = new Map<string, string>();

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

// check if given party exists
let partyExists = (partyId: string): boolean => {
  return io.sockets.adapter.rooms.has(partyId);
};

// generate a unique party id
let generatePartyId = (): string => {
  var partyId: string = "";

  var randOptions = {
    length: 6,
    charset: "alphabetic",
    capitalization: "uppercase",
  };

  // keeps looping until the randomly generated partyId is unique
  while (partyId == "" || partyExists(partyId)) {
    partyId = randomstring.generate(randOptions);
  }

  return partyId;
};

/*
Request -> Response
  party:create -> response:created
  party:join -> response:user-joining, response:joined
  disconnecting -> response:user-left
  party:message -> response:user-message
*/

io.on("connection", (socket: Socket) => {
  console.log(socket.id + " connected");

  // whenever we receive a create party request we create a party
  socket.on("party:create", ({ url }, callback) => {
    try {
      console.log(socket.id + " requested to create a party");

      // generate a unique party Id
      const partyId: string = generatePartyId();

      // create and join the party
      socket.join(partyId);
      parties.set(partyId, url);

      // return the partyId to the user who created it
      callback({ data: { partyId } });

      console.log(socket.id + " created party " + partyId);
    } catch {
      console.log(socket.id + "tried to fuck wid da server");
    }
  });

  // whenever we receive a join party request we try to join a party
  socket.on("party:join", ({ partyId }, callback) => {
    try {
      console.log(socket.id + " trying to join party " + partyId);

      // check the party exists
      if (partyExists(partyId)) {
        // join the party
        socket.join(partyId);

        // send response to user that they have joined the party
        callback({ data: { partyId, url: parties.get(partyId) } });

        // send response to all other party members
        socket
          .in(partyId)
          .emit("response:user-joined", { user: { sid: socket.id }, partyId });

        console.log(socket.id + " joined party " + partyId);
      } else {
        callback({
          error: { message: PARTY_JOIN_ERROR },
        });
      }
    } catch {
      console.log(socket.id + "tried to fuck wid da server");
    }
  });

  // send a message to the party
  socket.on("party:message", ({ partyId, message }) => {
    try {
      console.log(
        socket.id + " sent message " + message + " to party " + partyId
      );
      if (partyExists(partyId)) {
        try {
          // send message to all party members (including caller)
          io.to(partyId).emit("response:user-message", {
            user: { sid: socket.id },
            message,
          });
        } catch {
          // if the message failed to send
          socket.emit("error", { message: "Failed to send message" });
        }
      } else {
        socket.emit("error", { message: PARTY_JOIN_ERROR });
      }
    } catch {
      // something went wrong
      console.log(socket.id + "tried to fuck wid da server");
    }
  });

  // when someone has left the party, but there are still ppl in it
  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        // messages the room to notify everyone the person has left
        socket.to(room).emit("response:user-left", {
          partyId: room,
          user: { sid: socket.id },
        });
        console.log(socket.id + " left party " + room);
      }
    }
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
api.get("/stats", (req, res) => {});

api.get("/party/:partyId", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("someone is checking if party " + req.params.partyId + " exists");
  if (partyExists(req.params.partyId)) {
    res.send({
      data: {
        url: parties.get(req.params.partyId),
        partyId: req.params.partyId,
      },
    });
  } else {
    res.status(400).send({ error: { message: PARTY_JOIN_ERROR } });
  }
});

// start servers
api.listen(apiPort, () => {
  console.log(`api running on port ${apiPort}`);
});

httpServer.listen(socketPort, function () {
  console.log(`web socket running on port ${socketPort}`);
});
