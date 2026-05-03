const BASE_URL = window.location.origin;

let currentUser = null;
let socket = null;
let mode = "login";

// MODE SWITCH
function setMode(newMode) {
  mode = newMode;

  document.querySelectorAll(".register-only").forEach(el => {
    el.style.display = mode === "register" ? "flex" : "none";
  });
}

setMode("login");

// PASSWORD TOGGLE
function togglePassword() {
  const input = document.getElementById("password");
  input.type = input.type === "password" ? "text" : "password";
}

// SUBMIT
function handleSubmit() {
  if (mode === "register") register();
  else login();
}

// REGISTER + AUTO LOGIN
async function register() {
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(BASE_URL + "/register", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, firstName, lastName, password })
  });

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  const loginRes = await fetch(BASE_URL + "/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  if (!loginRes.ok) {
    alert("Account created but login failed");
    return;
  }

  currentUser = await loginRes.json();
  enterChat();
}

// LOGIN
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(BASE_URL + "/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  currentUser = await res.json();
  enterChat();
}

// ENTER CHAT
function enterChat() {
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";

  document.getElementById("userDisplay").innerText =
    "Logged in as: " + currentUser.displayName;

  loadMessages();
  connectWebSocket();
  loadTheme();
}

// LOAD MESSAGES
async function loadMessages() {
  const res = await fetch(BASE_URL + "/messages");
  const data = await res.json();

  const container = document.getElementById("messages");
  container.innerHTML = "";

  data.forEach(addMessage);
}

// SOCKET
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  socket = new WebSocket(protocol + window.location.host);

  socket.onmessage = (event) => {
    addMessage(JSON.parse(event.data));
  };
}

// SEND
function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if (!text) return;

  socket.send(JSON.stringify({
    username: currentUser.username,
    displayName: currentUser.displayName,
    text
  }));

  input.value = "";
}

// DISPLAY MESSAGE
function addMessage(msg) {
  const container = document.getElementById("messages");

  const div = document.createElement("div");
  const isMe = msg.sender === currentUser.username;

  div.className = isMe ? "message me" : "message";

  const time = new Date(msg.timestamp);
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  div.innerHTML = `
    <div class="top-row">
      <span class="name">${msg.displayName}</span>
      <span class="time">${formattedTime}</span>
    </div>
    <div class="text">${msg.text}</div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// THEME MENU
function toggleThemeMenu() {
  const menu = document.getElementById("themeMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function setTheme(theme) {
  document.body.className = "";
  if (theme !== "default") {
    document.body.classList.add(theme);
  }

  localStorage.setItem("theme", theme);
  document.getElementById("themeMenu").style.display = "none";
}

// LOAD THEME
function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.body.className = saved;
  }
}