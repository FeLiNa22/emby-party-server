import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import randomstring from "randomstring";
import { Party } from "./Party";
import { User } from "./User";

interface stats {
    total_parties: number;
    total_users: number;
    active_users: number;
    active_parties: number;
    active_watch_time: number;
}

// Launch the localhost API that will display stats of parties
const api = express();
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
const apiPort = 8080;
/* Gets all the statistics of the entire server */
api.get("/stats", (req, res) => {
});


const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: [],
    credentials: false,
  },
});

io.on("connection", (socket: Socket) => {

    console.log(socket.id + " connected");

    // whenever we receive a create party request we create a party
    socket.on("create party",  () => {

        console.log(socket.id + " requested to create a party");

        // generate a unique party id link
        var partyId : string = "";

        var randOptions = {
            length: 6,
            charset: 'alphabetic',
            capitalization: 'uppercase'
        };
        
        // keeps looping until the randomly generated partyId is unique
        while (partyId == "" || io.sockets.adapter.rooms.has(partyId)) {
            partyId = randomstring.generate(randOptions);
        }

        // create and join the party
        socket.join(partyId);

        // return the partyId to the user who created it
        socket.emit("user created party", partyId);

        console.log(socket.id + " created party " + partyId);
    });

    // whenever we receive a join party request we try to join a party
    socket.on("join party", (partyId : string) => {
        console.log(socket.id + " trying to join party " + partyId)

        // check the party exists
        if (io.sockets.adapter.rooms.has(partyId)) {

            // join the party
            socket.join(partyId);

            // send response to all party members
            io.in(partyId).emit("user joined party", socket.id, partyId);

            console.log(socket.id + " joined party " + partyId);

        } else {

            socket.emit("error", "party doesn't exist");

        }
    });

    // send a message to the party
    socket.on("message party",  (party: Party, message: string) => {
        socket.to(party.id).emit("user message party", socket.id, message);
    });

    // when someone has left the party, but there are still ppl in it
    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                console.log(socket.id + " left party " + room);
                // messages the room to notify everyone the person has left
                socket.to(room).emit("user left party", socket.id);
            }
        }
    });

    // when everyone has left the rooms
    socket.on('disconnect',  () => {
        console.log(socket.id + " completely disconnected");
    });

});

httpServer.listen(4000, function () {
    console.log("listening on *:4000");
});