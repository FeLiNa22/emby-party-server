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


// parties contains a map of all the unique ids given to parties
// it has key = partyId, value = true if party still exists
const parties: Record<string, boolean> = {};
const users: Record<string, User> = {};

const httpServer = createServer();
const io = new Server(httpServer);

io.on("connection", (socket: Socket) => {

    // whenever we receive a create party request we create a party
    socket.on("create party", function () {

        // generate a unique party id link
        var partyId = null;

        var randOptions = {
            length: 6,
            charset: 'alphabetic',
            capitalization: 'uppercase'
        };

        while (partyId == null || parties[partyId] === true) {
            partyId = randomstring.generate(randOptions);
        }

        // create and join the party
        socket.join(partyId);
        parties[partyId] = true;

        // return the partyId to the user who created it
        socket.emit("party created", partyId);
        console.log(socket.id + " created party " + partyId);
    });

    // whenever we receive a join party request we try to join a party
    socket.on("join party", function (user: User, party: Party) {
        
        // check the party exists
        if (parties[party.id] === true) {

            // join the party
            socket.join(party.id);
            // send response to all party members
            socket.to(party.id).emit("user joined party", user);

            console.log(socket.id + " joined party " + party.id);

        } else {

            socket.emit("user joined party", null);

        }
    });

    // send a message to the party
    socket.on("message party", function (party: Party, message: string) {
        socket.to(party.id).emit("message party", socket.id, message);
    });

    // when someone has left the party, but there are still ppl in it
    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                // messages the room to notify everyone the person has left
                socket.to(room).emit("user left party", socket.id);
            }
        }
    });

    // when everyone has left the rooms
    socket.on('disconnect', function () {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                // set the map entry to false for each room
                parties[room] = false;
            }
        }
    });

});

httpServer.listen(3000, function () {
    console.log("listening on *:3000");
});