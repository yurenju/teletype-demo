const { Document, serializeOperation, deserializeOperation } = require("@atom/teletype-crdt");
const Messages = require("@atom/teletype-client/lib/teletype-client_pb");
const express = require("express");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = 3000;

let clientCount = 1;
const document = new Document({ siteId: clientCount });
console.log("Initial");

app.use(express.static(__dirname));

app.get("/operations", (req, res) => {
  const operations = document.getOperations().map(serializeOperation);
  const msg = new Messages.BufferProxy();
  msg.setOperationsList(operations);
  const buffer = Buffer.from(msg.serializeBinary().buffer);
  res.send(buffer);
});

app.post("/join", (req, res) => {
  clientCount++;
  res.send({ siteId: clientCount });
});

http.listen(port);

io.on("connection", function(socket) {
  socket.on("push-operations", function(req) {
    const msg = Messages.BufferProxy.deserializeBinary(req);
    document.integrateOperations(msg.getOperationsList().map(deserializeOperation));
    console.log("push-operations", document.getText());
    socket.broadcast.emit("push-operations", req);
  });
});
