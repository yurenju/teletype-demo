const { Document, serializeOperation, deserializeOperation } = require("@atom/teletype-crdt");
const Messages = require("@atom/teletype-client/lib/teletype-client_pb");
const app = require("express")();
const bodyParser = require("body-parser");
const port = 3000;

let clientCount = 1;
const document = new Document({ siteId: clientCount });

app.get("/operations", (req, res) => {
  const operations = document.getOperations().map(serializeOperation);
  const msg = new Messages.BufferProxy();
  console.log(operations);
  msg.setOperationsList(operations);
  res.send(msg.serializeBinary());
});

app.post("/operations", bodyParser.raw(), (req, res) => {
  const msg = Messages.BufferProxy.deserializeBinary(req.body);
  document.integrateOperations(msg.getOperationsList().map(deserializeOperation));
  console.log(document.getText());
  res.end();
});

app.post("/join", (req, res) => {
  clientCount++;
  res.send({ siteId: clientCount });
});

app.get("/", (req, res) => res.send("Hello World"));
app.listen(port, () => console.log(`express is running on port ${port}`));
