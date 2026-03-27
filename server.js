const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server);

/* ------------------ DB ------------------ */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"));

/* ------------------ MODELS ------------------ */

// USERS (from certificate project)
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  certificateId: String
}));

// CHAT
const Message = mongoose.model("Message", new mongoose.Schema({
  name: String,
  message: String,
  time: String
}));

// PINS
const Pin = mongoose.model("Pin", new mongoose.Schema({
  name: String,
  lat: String,
  lng: String,
  user: String
}));

// TRIPS
const Trip = mongoose.model("Trip", new mongoose.Schema({
  name: String,
  date: String,
  days: Number,
  from: String,
  to: String,
  stops: [String],
  status: String,
  user: String
}));

/* ---------------- VERIFY ---------------- */

app.post("/verify", async (req, res) => {

  const { certificateId } = req.body;

  const user = await User.findOne({ certificateId });

  if (!user) return res.json({ success: false });

  res.json({ success: true, name: user.name });

});

/* ---------------- CHAT ---------------- */

io.on("connection", async (socket) => {

  console.log("User connected");

  const messages = await Message.find().sort({ _id: 1 }).limit(100);
  socket.emit("loadMessages", messages);

  socket.on("sendMessage", async (data) => {

    const msg = new Message(data);
    await msg.save();

    io.emit("receiveMessage", data);

  });

});

/* ---------------- PINS ---------------- */

// SAVE PIN
app.post("/pins", async (req, res) => {
  const pin = new Pin(req.body);
  await pin.save();
  res.json({ success: true });
});

// GET PINS
app.get("/pins/:user", async (req, res) => {
  const pins = await Pin.find({ user: req.params.user });
  res.json(pins);
});

// DELETE PIN
app.delete("/pins/:id", async (req, res) => {
  await Pin.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

/* ---------------- TRIPS ---------------- */

// SAVE TRIP
app.post("/trips", async (req, res) => {
  const trip = new Trip(req.body);
  await trip.save();
  res.json({ success: true });
});

// GET TRIPS
app.get("/trips/:user", async (req, res) => {
  const trips = await Trip.find({ user: req.params.user });
  res.json(trips);
});

// DELETE TRIP
app.delete("/trips/:id", async (req, res) => {
  await Trip.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});