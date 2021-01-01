"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Launch the localhost API that will display stats of parties
const api = express_1.default();
api.use(express_1.default.json());
api.use(express_1.default.urlencoded({ extended: true }));
const apiPort = 8080;
/* Gets all the statistics of the entire server */
api.get("/stats", (req, res) => {
});
// O(1) - O(log n) dicctionary search up
const parties = {};
const httpServer = http_1.createServer();
const io = new socket_io_1.Server(httpServer);
io.on("connection", (socket) => {
    // whenever we receive a create party request we create a party
    socket.on("create party", function () {
        socket.join(party.id);
        socket.to(party.id).emit("user joined", socket.id);
        console.log(party.id);
    });
    // whenever we receive a join party request we try to join a party
    socket.on("join party", function (party) {
        socket.join(party.id);
        socket.to(party.id).emit("user joined", socket.id);
        console.log(party.id);
    });
});
httpServer.listen(3000, function () {
    console.log("listening on *:3000");
});
