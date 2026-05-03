const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());

let users = [];
let messages = [];

// --- REGISTER ---
app.post("/register", async (req, res) => {
  const { username, firstName, lastName, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).send("Username already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  users.push({ username, firstName, lastName, password: hashed });

  res.send("Account created");
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send("Wrong password");

  res.send({
    username: user.username,
    displayName: user.firstName + " " + user.lastName
  });
});

// --- GET MESSAGES ---
app.get("/messages", (req, res) => {
  res.send(messages);
});

// --- WEBSOCKET ---
wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    const messageObj = {
      sender: msg.username,
      displayName: msg.displayName,
      text: msg.text,
      timestamp: Date.now()
    };

    messages.push(messageObj);

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageObj));
      }
    });
  });
});

app.get("/", (req, res) => {
  res.send("Server running");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
