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
const MONGO_URI = "mongodb+srv://AZ_Video_Chat:Abulaish35@az-db.dew7i3w.mongodb.net/?appName=AZ-DB";

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// --- 3. USER SCHEMA UPDATE (Strict Validation) ---
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Name is required"] 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true, 
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"] 
    }
});

// 🚨 IMP: Ye Line Missing thi! Iske bina Signup/Login fail ho jayega
const User = mongoose.model('User', userSchema);

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
        // Agar Mongoose validation fail hua, to error bhejo
        if(error.name === "ValidationError") {
            return res.status(400).json({ message: error.message, error: error.message });
        }
        res.status(500).json({ message: "Server Error" });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.password !== password) { 
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
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const users = {}; 
const socketToRoom = {}; 

io.on("connection", socket => {
    socket.on("join room", roomID => {
        // 1. User ko Socket Room mein officially Join karao (Ye Missing tha!) 👇
        socket.join(roomID);  

        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 5) {
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

    // --- CHAT MESSAGE LOGIC (Add inside io.on connection) ---
    socket.on("send message", (body) => {
        io.to(body.roomID).emit("receive message", body);
    });

    // --- FILE SHARING EVENT ---
    socket.on("send-file", (data) => {
        // roomID ka spelling sahi kiya
        io.to(data.roomID).emit("receive-file", data);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit("user joined", { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit("receiving returned signal", { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user left', socket.id);
    });
});

// --- 6. SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));