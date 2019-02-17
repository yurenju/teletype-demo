import io from "socket.io-client";
import { Document, deserializeOperation, serializeOperation } from "@atom/teletype-crdt";
import Messages from "@atom/teletype-client/lib/teletype-client_pb";

const baseUrl = "http://localhost:3000";
const socket = io.connect(baseUrl);

const editor = document.getElementById("editor");
let doc;

(async function() {
  const { siteId } = await fetch(`${baseUrl}/join`, { method: "POST" }).then(res => res.json());
  doc = new Document({ siteId });
  const blob = await fetch(`${baseUrl}/operations`).then(res => res.blob());
  const buffer = await new Response(blob).arrayBuffer();

  const msg = Messages.BufferProxy.deserializeBinary(new Uint8Array(buffer));
  doc.integrateOperations(msg.getOperationsList().map(deserializeOperation));

  editor.value = doc.getText();
})();

editor.addEventListener("input", ({ target, data, inputType }) => {
  let start, end, text;
  if (inputType === "insertText") {
    start = { row: 0, column: target.selectionStart - 1 };
    end = { row: 0, column: 0 };
    text = data;
  } else if (inputType === "deleteContentBackward") {
    start = { row: 0, column: target.selectionStart };
    end = { row: 0, column: target.selectionStart + 1 };
    text = "";
  }
  const ops = doc.setTextInRange(start, end, text);
  const serialized = ops.map(serializeOperation);
  const msg = new Messages.BufferProxy();
  msg.setOperationsList(serialized);

  socket.emit("push-operations", msg.serializeBinary().buffer);
});

socket.on("push-operations", req => {
  const msg = Messages.BufferProxy.deserializeBinary(req);
  doc.integrateOperations(msg.getOperationsList().map(deserializeOperation));
  console.log("push-operations", doc.getText());
  editor.value = doc.getText();
});
