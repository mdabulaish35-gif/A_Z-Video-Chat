# 🎥 AZ Video Chat App — Real-Time Video Calling & Chat App (MERN Stack)

A full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** web application built for real-time peer-to-peer video calling, live text messaging, and seamless media/file sharing powered by **WebRTC** and **Socket.io**.

🔗 **Live Demo:** [https://az-chat.vercel.app](https://az-chat.vercel.app)

---

## ✨ Key Features

* **Real-Time Video & Audio Calling:** Low-latency peer-to-peer video and audio streaming built with **WebRTC (SimplePeer)**.
* **Instant Live Chat:** Bi-directional, real-time messaging powered by **Socket.io** with instant delivery.
* **Room-Based Connections:** Create or join private rooms effortlessly for secure 1-on-1 or group communication.
* **Media Controls:** Toggle microphone, camera, and call controls smoothly during an active session.
* **Full-Stack Persistence:** Backend API built with **Express.js** and **MongoDB** for managing users, room metadata, and session history.
* **Responsive UI:** Clean, modern **React.js** interface optimized for both desktop and mobile screens.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM / MongoDB Atlas) |
| **Real-Time Communication** | WebRTC (SimplePeer), Socket.io |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 🏗️ System Architecture

1. **Client (React.js):** Captures local media streams (`navigator.mediaDevices.getUserMedia`) and establishes WebRTC peer connections.
2. **Signaling Server (Node.js + Express + Socket.io):** Exchanges SDP offers/answers and ICE candidates between peers to establish direct P2P connections and broadcasts live chat events.
3. **Database (MongoDB):** Stores application records, room details, and user/message data via Mongoose schemas.

---

## 📁 Project Structure

```text
AZ_Chat/
├── client/                 # React.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Video player, Chat box, Controls
│   │   ├── App.js          # Main application logic & WebRTC/Socket setup
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js + Express + Socket.io Backend
│   ├── models/             # MongoDB / Mongoose schemas
│   ├── routes/             # REST API routes
│   ├── server.js           # Express & Socket.io signaling server
│   └── package.json
└── README.md
```

---

## 🚀 Run Locally

Follow these steps to run the project on your local machine:

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### 2. Clone the Repository
```bash
git clone https://github.com/mdabulaish35-gif/<your-repo-name>.git
cd <your-repo-name>
```

### 3. Configure Environment Variables
Create a `.env` file inside the `server` folder and add:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
```

Create a `.env` file inside the `client` folder (if applicable):
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

### 4. Install Dependencies & Start Servers

**Start the Backend Server:**
```bash
cd server
npm install
npm start
```

**Start the Frontend Client (in a new terminal):**
```bash
cd client
npm install
npm start
```

The application will open at `http://localhost:3000`.

---

## 🌐 Deployment

* **Frontend:** Deployed on **Vercel** ([https://az-chat.vercel.app](https://az-chat.vercel.app))
* **Backend & Signaling Server:** Deployed on **Render**
* **Database:** Hosted on **MongoDB Atlas**

---

## 👨‍💻 Author

**Md Abulaish**
* Portfolio: [https://mdabulaish35-gif.github.io/](https://mdabulaish35-gif.github.io/)
* GitHub: [@mdabulaish35-gif](https://github.com/mdabulaish35-gif)

---

## 📄 License

This project is open-source and available under the MIT License.
