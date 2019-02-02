const fetch = require("node-fetch");
const { Document, deserializeOperation, serializeOperation } = require("@atom/teletype-crdt");
const Messages = require("@atom/teletype-client/lib/teletype-client_pb");

const baseUrl = "http://localhost:3000";

(async function() {
  const { siteId } = await fetch(`${baseUrl}/join`, { method: "POST" }).then(res => res.json());
  const document = new Document({ siteId });
  const operations = await fetch(`${baseUrl}/operations`).then(res => res.blob());
  const msg = Messages.BufferProxy.deserializeBinary(new Uint8Array(operations));
  document.integrateOperations(msg.getOperationsList().map(deserializeOperation));

  const newOps = document.setTextInRange(0, 0, "hello world").map(serializeOperation);
  const msg2 = new Messages.BufferProxy();
  msg2.setOperationsList(newOps);
  await fetch(`${baseUrl}/operations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    body: msg2.serializeBinary().buffer
  });
})();
