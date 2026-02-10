const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// --- 1. SETUP MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- 2. MONGODB CONNECTION ---
// NOTE: "AZ_Video_Chat" ki jagah wo username likhna jo step 1 mein dikha tha
const MONGO_URI = "mongodb+srv://AZ_Video_Chat:Abulaish35@az-db.dew7i3w.mongodb.net/?appName=AZ-DB";

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// --- 3. USER SCHEMA (Data Model) ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// --- 4. AUTH ROUTES (Login/Signup API) ---

// SIGNUP
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: "User created", user: { name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.password !== password) { // Note: Real app me password hash karna chahiye (bcrypt)
            return res.status(400).json({ message: "Invalid Password" });
        }

        res.status(200).json({ message: "Login Successful", user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// --- 5. SOCKET.IO SETUP (Video Chat Logic) ---
const io = socket(server, {
    cors: {
        origin: "*", // Sabko allow karo
        methods: ["GET", "POST"]
    }
});

const users = {}; // Room users track karne ke liye
const socketToRoom = {}; // Socket ID se Room ID nikalne ke liye

io.on("connection", socket => {
    // User Room Join karega
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    // Signal bhejna (Call karna)
    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit("user joined", { signal: payload.signal, callerID: payload.callerID });
    });

    // Signal wapis karna (Answer karna)
    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit("receiving returned signal", { signal: payload.signal, id: socket.id });
    });

    // User Left Logic
    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        // Sabko batao ki banda gaya
        socket.broadcast.emit('user left', socket.id);
    });
});

// --- 6. SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));