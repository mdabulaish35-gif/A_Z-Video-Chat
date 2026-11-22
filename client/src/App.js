/* eslint-disable */
import "./utils/polyfills";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import { SERVER_URL } from "./config";
import { Icons } from "./components/Icons";
import Video from "./components/Video";
import AuthScreen from "./components/AuthScreen";
import ChatBox from "./components/ChatBox";

const Peer = require("simple-peer");
const socket = io.connect(SERVER_URL);

function App() {
    const [peers, setPeers] = useState([]);
    const [roomID, setRoomID] = useState("");
    const [joined, setJoined] = useState(false);
    const [stream, setStream] = useState();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [pos, setPos] = useState({ x: window.innerWidth - 130, y: window.innerHeight - 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [bigMe, setBigMe] = useState(false);
    const [facingMode, setFacingMode] = useState("user");
    const [showSplash, setShowSplash] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const [showChat, setShowChat] = useState(false);
    const [isChatFullScreen, setIsChatFullScreen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const socketRef = useRef(socket);
    const isLeaving = useRef(false);
    const userVideoRef = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef();
    const isOneOnOne = peers.length === 1;

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem("az_chat_user_mongo");
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }, []);

    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        localStorage.setItem("az_chat_user_mongo", JSON.stringify(user));
    };

    const handleLogout = () => {
        localStorage.removeItem("az_chat_user_mongo");
        setCurrentUser(null);
        setJoined(false);
        window.location.reload();
    };

    const handleDragStart = () => { if (isOneOnOne) setIsDragging(true); };
    const handleDragEnd = () => { setIsDragging(false); };
    const handleDragMove = (e) => {
        if (!isDragging || !isOneOnOne) return;
        let clientX, clientY;
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            e.preventDefault();
            clientX = e.clientX;
            clientY = e.clientY;
        }
        setPos({ x: clientX - 50, y: clientY - 70 });
    };

    const getDragHandlers = (isFloating) => {
        if (!isFloating) return {};
        return { onDragStart: handleDragStart, onDragMove: handleDragMove, onDragEnd: handleDragEnd };
    };

    const toggleView = () => { if (isOneOnOne) setBigMe(!bigMe); };

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isLeaving.current) return;
            if (joined) event.returnValue = "Are you sure you want to leave?";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [joined]);

    useEffect(() => {
        startVideo("user");

        socket.on("room full", () => {
            alert("⚠️ Room is Full! (Max 5 Users allowed)");
            window.location.reload();
        });

        socket.on("all users", (users) => {
            const newPeers = [];
            users.forEach((userID) => {
                const peer = createPeer(userID, socket.id, streamRef.current);
                if (peer) {
                    peer.peerID = userID;
                    peersRef.current.push(peer);
                    newPeers.push(peer);
                }
            });
            setPeers(newPeers);
        });

        socket.on("user joined", (payload) => {
            const alreadyExists = peersRef.current.find((p) => p.peerID === payload.callerID);
            if (alreadyExists) return;

            const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
            if (peer) {
                peer.peerID = payload.callerID;
                peersRef.current.push(peer);
                setPeers((prevPeers) => [...prevPeers, peer]);
            }
        });

        socket.on("receiving returned signal", (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) item.signal(payload.signal);
        });

        socket.on("user left", (id) => {
            const peerObj = peersRef.current.find((p) => p.peerID === id);
            if (peerObj) { try { peerObj.destroy(); } catch (e) {} }
            peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
            setPeers((prevPeers) => [...prevPeers.filter((peer) => peer.peerID !== id)]);
        });

        return () => {
            socket.off("room full");
            socket.off("user left");
            socket.off("user joined");
            socket.off("receiving returned signal");
            socket.off("all users");
        };
    }, []);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleMessage = (data) => setMessages((oldMsgs) => [...oldMsgs, data]);
        const handleFile = (data) => setMessages((oldMsgs) => [...oldMsgs, data]);

        socketRef.current.on("receive message", handleMessage);
        socketRef.current.on("receive-file", handleFile);

        return () => {
            socketRef.current.off("receive message", handleMessage);
            socketRef.current.off("receive-file", handleFile);
        };
    }, []);

    useEffect(() => {
        if (joined && stream && userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
        }
    }, [joined, stream]);

    const startVideo = (mode) => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: true })
            .then((currentStream) => {
                if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
                setStream(currentStream);
                streamRef.current = currentStream;
                if (userVideoRef.current) userVideoRef.current.srcObject = currentStream;

                peersRef.current.forEach((peer) => {
                    if (peer && !peer.destroyed) {
                        try {
                            const oldTrack = peer.streams[0]?.getVideoTracks()[0];
                            const newTrack = currentStream.getVideoTracks()[0];
                            if (oldTrack && newTrack) peer.replaceTrack(oldTrack, newTrack, peer.streams[0]);
                        } catch (e) { console.log(e); }
                    }
                });
            })
            .catch((err) => console.error("Camera Error:", err));
    };

    const switchCamera = () => {
        const newMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newMode);
        startVideo(newMode);
    };

    function createPeer(userToSignal, callerID, currentStream) {
        if (!currentStream) return null;
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: currentStream,
            config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
        });
        peer.on("signal", (signal) => socket.emit("sending signal", { userToSignal, callerID, signal }));
        return peer;
    }

    function addPeer(incomingSignal, callerID, currentStream) {
        if (!currentStream) return null;
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: currentStream,
            config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
        });
        peer.on("signal", (signal) => socket.emit("returning signal", { signal, callerID }));
        peer.signal(incomingSignal);
        return peer;
    }

    const joinRoom = () => {
        if (roomID !== "") {
            socket.emit("join room", roomID);
            setJoined(true);
        } else {
            alert("Please enter a Room Name");
        }
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOn(videoTrack.enabled);
            }
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() === "" || !socketRef.current) return;

        const msgData = {
            roomID,
            user: currentUser ? currentUser.name : "Guest",
            text: message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        socketRef.current.emit("send message", msgData);
        setMessage("");
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("File too big! Please send under 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (socketRef.current) {
                socketRef.current.emit("send-file", {
                    roomID,
                    user: currentUser ? currentUser.name : "Guest",
                    file: reader.result,
                    fileName: file.name,
                    type: "file"
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const shareScreen = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = screenStream.getTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            peersRef.current.forEach((peer) => peer.replaceTrack(videoTrack, screenTrack, stream));

            if (userVideoRef.current) {
                userVideoRef.current.srcObject = screenStream;
                userVideoRef.current.style.transform = "none";
            }

            screenTrack.onended = () => {
                peersRef.current.forEach((peer) => peer.replaceTrack(screenTrack, videoTrack, stream));
                if (userVideoRef.current) {
                    userVideoRef.current.srcObject = stream;
                    userVideoRef.current.style.transform = "scaleX(-1)";
                }
            };
        } catch (err) {
            console.log("Screen Share Error:", err);
            alert("Unable to share screen. Permissions denied or not supported on this browser.");
        }
    };

    const leaveRoom = () => {
        isLeaving.current = true;
        window.location.reload();
    };

    const getPeerLayout = () => {
        if (!isOneOnOne) return { className: "video-card", style: {} };
        return bigMe
            ? { className: "floating-me", style: { left: pos.x, top: pos.y } }
            : { className: "one-on-one-peer", style: {} };
    };

    const getMeLayout = () => {
        if (!isOneOnOne) return { className: "video-card", style: {} };
        return bigMe
            ? { className: "one-on-one-peer", style: {} }
            : { className: "floating-me", style: { left: pos.x, top: pos.y } };
    };

    if (showSplash) {
        return (
            <div className="splash-container">
                <div className="splash-content">
                    <img src="/logo.png" alt="Logo" className="splash-logo" />
                    <h1 className="splash-title">A_Z Video Chat</h1>
                    <div className="splash-loader"></div>
                </div>
            </div>
        );
    }

    const peerLayout = getPeerLayout();
    const meLayout = getMeLayout();

    return (
        <div className="app-container" onMouseMove={handleDragMove} onMouseUp={handleDragEnd}>
            <div className="app-header">
                <h2 className="brand-title">
                    📹 <span className="brand-light">A_Z</span><span className="brand-bold"> Video Chat</span>
                </h2>
                {currentUser && !joined && (
                    <button onClick={handleLogout} className="room-badge logout-btn">
                        Logout
                    </button>
                )}
                {joined && <div className="room-badge">Room: {roomID}</div>}
            </div>

            {!joined ? (
                <div className="login-container">
                    <img src="/background-collage.png" alt="Background Decoration" className="background-image" />
                    {!currentUser ? (
                        <AuthScreen onLogin={handleLoginSuccess} />
                    ) : (
                        <div className="login-card">
                            <h2 className="card-title">Hi, {currentUser.name}!</h2>
                            <h4 className="card-subtitle lobby-subtitle">Enter Room Name To Talk</h4>
                            <input
                                type="text"
                                name="room"
                                placeholder="Enter Room Name Here"
                                onChange={(e) => setRoomID(e.target.value)}
                                className="input-field"
                            />
                            <button onClick={joinRoom} className="join-btn">Join Now</button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid-container">
                        {peers.map((peer) => {
                            if (!peer.peerID) return null;
                            return (
                                <Video
                                    key={peer.peerID}
                                    peer={peer}
                                    className={peerLayout.className}
                                    style={peerLayout.style}
                                    onDragStart={getDragHandlers(isOneOnOne && bigMe).onDragStart}
                                    onDragMove={getDragHandlers(isOneOnOne && bigMe).onDragMove}
                                    onDragEnd={getDragHandlers(isOneOnOne && bigMe).onDragEnd}
                                    onClick={bigMe ? toggleView : null}
                                />
                            );
                        })}
                        <div
                            className={meLayout.className}
                            style={meLayout.style}
                            onClick={!bigMe ? toggleView : null}
                            onMouseDown={getDragHandlers(!bigMe).onDragStart}
                            onTouchStart={getDragHandlers(!bigMe).onDragStart}
                            onTouchMove={getDragHandlers(!bigMe).onDragMove}
                            onTouchEnd={getDragHandlers(!bigMe).onDragEnd}
                        >
                            <video
                                muted
                                ref={userVideoRef}
                                autoPlay
                                playsInline
                                className="video-element"
                                style={{ transform: "scaleX(-1)" }}
                            />
                            {!isOneOnOne && <div className="name-tag">You ({currentUser.name})</div>}
                            <div className={`status-dot ${micOn ? "mic-on" : "mic-off"}`}></div>
                        </div>
                    </div>

                    <div className="controls-bar">
                        <button onClick={toggleMic} className={`control-btn ${micOn ? "" : "danger"}`}>
                            {micOn ? <Icons.MicOn /> : <Icons.MicOff />}
                        </button>
                        <button onClick={toggleCamera} className={`control-btn ${cameraOn ? "" : "danger"}`}>
                            {cameraOn ? <Icons.CamOn /> : <Icons.CamOff />}
                        </button>
                        <button onClick={shareScreen} className="control-btn">
                            <Icons.ScreenShare />
                        </button>
                        <button onClick={() => setShowChat(!showChat)} className={`control-btn ${showChat ? "active" : ""}`}>
                            <Icons.Chat />
                        </button>
                        <button onClick={switchCamera} className="control-btn">
                            <Icons.Flip />
                        </button>
                        <button onClick={leaveRoom} className="control-btn end-call">
                            <Icons.CallEnd />
                        </button>
                    </div>

                    {showChat && (
                        <ChatBox
                            isChatFullScreen={isChatFullScreen}
                            setIsChatFullScreen={setIsChatFullScreen}
                            setShowChat={setShowChat}
                            messages={messages}
                            currentUser={currentUser}
                            setSelectedImage={setSelectedImage}
                            handleFileChange={handleFileChange}
                            message={message}
                            setMessage={setMessage}
                            sendMessage={sendMessage}
                        />
                    )}
                </>
            )}

            {selectedImage && (
                <div className="image-preview-overlay" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Preview" className="image-preview-img" />
                    <button className="image-preview-close">✕</button>
                </div>
            )}
        </div>
    );
}

export default App;