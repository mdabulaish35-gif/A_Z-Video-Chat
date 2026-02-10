/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "https://az-chat.onrender.com";

// --- 1. CRASH GUARD ---
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = window.process || {};
    window.process.env = window.process.env || { NODE_DEBUG: undefined };
    if (!window.process.nextTick) window.process.nextTick = (cb) => setTimeout(cb, 0);
    try { window.Buffer = window.Buffer || require("buffer").Buffer; } catch (e) { window.Buffer = {}; }
}

const Peer = require("simple-peer");
const socket = io.connect("https://az-chat.onrender.com");

// --- ICONS (Same as before) ---
const Icons = {
    ScreenShare: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>,
    MicOn: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>,
    MicOff: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 5.02L12 18.06l-2.98-2.04C7.89 15.26 7 13.91 7 12.33v-.17L4.13 9.29L2.86 10.56 12 19.7 21.14 10.56 19.87 9.29 16.29 12.87v.46c0 .72-.19 1.4-.53 2.02l.51.51c.32-.57.53-1.22.53-1.92v-2.12l-1.82 1.8zM12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 .55.15 1.06.41 1.51l2.58 2.58c.01-.03.01-.06.01-.09z"/></svg>,
    CamOn: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>,
    CamOff: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>,
    Flip: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"/></svg>,
    CallEnd: () => <svg fill="white" height="24" viewBox="0 0 24 24" width="24"><path d="M12 9c-1.6 0-3.15.25-4.6.72-.81.26-1.38 1-1.38 1.87v2.23c0 .85.55 1.6 1.34 1.82.93.26 1.9.43 2.89.49.62.04 1.18-.32 1.41-.88l1.04-2.58c.17-.42.66-.63 1.09-.45.42.17.64.66.47 1.09l-1.04 2.58c-.53 1.33-1.85 2.18-3.28 2.09-1.42-.09-2.76-.36-4.04-.78-1.78-.58-3-2.25-3-4.13V11.6c0-1.95 1.27-3.61 3.09-4.2C8.5 6.42 10.22 6 12 6s3.5.42 5.09 1.4c1.82.59 3.09 2.25 3.09 4.2v1.52c0 1.88-1.22 3.55-3 4.13-1.28.42-2.62.69-4.04.78-1.43.09-2.75-.76-3.28-2.09l-1.04-2.58c-.17-.43.05-.92.47-1.09.43-.18.92.03 1.09.45l1.04 2.58c.23.56.79.92 1.41.88.99-.06 1.96-.23 2.89-.49.79-.22 1.34-.97 1.34-1.82v-2.23c0-.87-.57-1.61-1.38-1.87C15.15 9.25 13.6 9 12 9z" transform="scale(1.2) translate(-2, -2)" fill="#fff"/></svg>
};

const Video = (props) => {
    const ref = useRef();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const peer = props.peer;
        const handleStream = (stream) => { if (ref.current) ref.current.srcObject = stream; };
        
        if (peer) {
            peer.on("stream", handleStream);
            if (peer._remoteStreams && peer._remoteStreams.length > 0) {
                if (ref.current) ref.current.srcObject = peer._remoteStreams[0];
            }
            peer.on("close", () => { setIsVisible(false); });
            peer.on("error", () => { setIsVisible(false); });
        }
        return () => { if (peer) peer.off("stream", handleStream); };
    }, [props.peer]);

    if (!isVisible) return null;

    return (
        <div
            style={props.customStyle || styles.videoCard}
            onMouseDown={props.onDragStart} onMouseMove={props.onDragMove} onMouseUp={props.onDragEnd}
            onTouchStart={props.onDragStart} onTouchMove={props.onDragMove} onTouchEnd={props.onDragEnd}
            onClick={props.onClick}
        >
            <video playsInline autoPlay ref={ref} style={styles.videoElement} />
            <div style={styles.nameTag}>User</div>
        </div>
    );
}

// --- NEW ICONS FOR PASSWORD SHOW/HIDE ---
// (Isse upar wale Icons object mein add karein ya alag se define karein)
const EyeIcon = () => (
    <svg fill="#aaa" height="20" viewBox="0 0 24 24" width="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
);
const EyeOffIcon = () => (
    <svg fill="#aaa" height="20" viewBox="0 0 24 24" width="20"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
);

// --- UPDATED AUTH SCREEN ---
const AuthScreen = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false); // Toggle state
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async () => {
        // Validation Logic
        if (!formData.email || !formData.password) {
            setError("Please fill all details");
            return;
        }

        // Signup Specific Validation
        if (!isLogin) {
            if (!formData.name) {
                setError("Name is required");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match!");
                return;
            }
        }

        setLoading(true);
        const endpoint = isLogin ? "/login" : "/signup";
        
        try {
            // NOTE: Ensure SERVER_URL is defined correctly in your App.js
            const response = await fetch(`${SERVER_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user);
            } else {
                setError(data.message || "Something went wrong");
            }
        } catch (err) {
            setError("Server connection failed. Is Backend running?");
            console.error(err);
        }
        setLoading(false);
    };

    // Styles for password container
    const passwordContainerStyle = {
        position: "relative",
        width: "100%",
        marginBottom: "20px"
    };

    const eyeButtonStyle = {
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center"
    };

    return (
        <div style={styles.loginCard}>
            <h2 style={{ color: "white", marginTop: "0", marginBottom: "10px" }}>
                {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <h4 style={{ color: "#4CAF50", marginTop: "0", marginBottom: "30px", fontWeight: "normal", fontSize: "16px" }}>
                {isLogin ? "Login to A_Z Video Chat" : "Sign up to get started"}
            </h4>

            {!isLogin && (
                <input 
                    type="text" 
                    name="name" 
                    placeholder="Full Name" 
                    onChange={handleChange} 
                    style={styles.input} 
                />
            )}
            
            <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                onChange={handleChange} 
                style={styles.input} 
            />

            {/* PASSWORD FIELD WITH EYE ICON */}
            <div style={passwordContainerStyle}>
                <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder={isLogin ? "Enter Password Here" : "Create Password"} 
                    onChange={handleChange} 
                    style={{ ...styles.input, marginBottom: 0 }} // Remove bottom margin to fit container
                />
                <button type="button" onClick={togglePasswordVisibility} style={eyeButtonStyle}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>

            {/* CONFIRM PASSWORD FIELD (Only for Signup) */}
            {!isLogin && (
                <div style={passwordContainerStyle}>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        placeholder="Confirm Password" 
                        onChange={handleChange} 
                        style={{ ...styles.input, marginBottom: 0 }} 
                    />
                </div>
            )}
            
            {error && <p style={{ color: "#ff4444", fontSize: "14px", marginTop: "10px" }}>{error}</p>}

            <button onClick={handleSubmit} style={{...styles.joinBtn, marginTop: "10px"}} disabled={loading}>
                {loading ? "Please wait..." : (isLogin ? "Login" : "Sign Up")}
            </button>

            <p style={{ color: "#aaa", fontSize: "14px", marginTop: "20px", cursor: "pointer" }} onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ name: "", email: "", password: "", confirmPassword: "" });
            }}>
                {isLogin ? "New user? Create Account" : "Already have account? Login"}
            </p>
        </div>
    );
};
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
    
    // STATES
    const [showSplash, setShowSplash] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const isLeaving = useRef(false);
    const userVideoRef = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef();
    const isOneOnOne = peers.length === 1;

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000); 
        return () => clearTimeout(timer);
    }, []);

    // Check Local Storage for Auto-Login
    useEffect(() => {
        const savedUser = localStorage.getItem("az_chat_user_mongo");
        if(savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
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

    const getDragHandlers = (isFloating) => {
        if(!isFloating) return {};
        return { onDragStart: handleDragStart, onDragMove: handleDragMove, onDragEnd: handleDragEnd };
    };

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isLeaving.current) return;
            if (joined) {
                event.returnValue = "Are you sure you want to leave?";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [joined]);

    const handleDragStart = () => { if (isOneOnOne) setIsDragging(true); };
    const handleDragEnd = () => { setIsDragging(false); };
    const handleDragMove = (e) => {
        if (!isDragging || !isOneOnOne) return;
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            e.preventDefault();
            clientX = e.clientX;
            clientY = e.clientY;
        }
        setPos({ x: clientX - 50, y: clientY - 70 });
    };

    const toggleView = () => { if (isOneOnOne) setBigMe(!bigMe); };

    useEffect(() => {
        startVideo("user");

        socket.on("all users", users => {
            const peers = [];
            users.forEach(userID => {
                const peer = createPeer(userID, socket.id, streamRef.current);
                if(peer) {
                    peer.peerID = userID;
                    peersRef.current.push(peer);
                    peers.push(peer);
                }
            })
            setPeers(peers);
        });

        socket.on("user joined", payload => {
            const alreadyExists = peersRef.current.find(p => p.peerID === payload.callerID);
            if (alreadyExists) return;

            const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
            if(peer) {
                peer.peerID = payload.callerID;
                peersRef.current.push(peer);
                setPeers(prevPeers => [...prevPeers, peer]);
            }
        });

        socket.on("receiving returned signal", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) item.signal(payload.signal);
        });

        socket.on("user left", id => {
            const peerObj = peersRef.current.find(p => p.peerID === id);
            if (peerObj) { try { peerObj.destroy(); } catch(e){} }
            peersRef.current = peersRef.current.filter(p => p.peerID !== id);
            setPeers(prevPeers => [...prevPeers.filter(peer => peer.peerID !== id)]);
        });

        return () => { 
            socket.off("user left");
            socket.off("user joined");
            socket.off("receiving returned signal");
            socket.off("all users");
        };
    }, []);

    const startVideo = (mode) => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: true })
            .then(currentStream => {
                if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
                setStream(currentStream);
                streamRef.current = currentStream;
                if (userVideoRef.current) userVideoRef.current.srcObject = currentStream;

                peersRef.current.forEach((peer) => {
                    if (peer && !peer.destroyed) {
                        try {
                            const oldTrack = peer.streams[0]?.getVideoTracks()[0];
                            const newTrack = currentStream.getVideoTracks()[0];
                            if (oldTrack && newTrack) peer.replaceTrack(oldTrack, newTrack, peer.streams[0]);
                        } catch(e) { console.log(e) }
                    }
                });
            })
            .catch(err => console.error("Camera Error:", err));
    };

    const switchCamera = () => {
        const newMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newMode);
        startVideo(newMode);
    };

    useEffect(() => {
        if (joined && stream && userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
        }
    }, [joined, stream]);

    function createPeer(userToSignal, callerID, stream) {
        if(!stream) return null;
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
        });
        peer.on("signal", signal => socket.emit("sending signal", { userToSignal, callerID, signal }));
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        if(!stream) return null;
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
        });
        peer.on("signal", signal => socket.emit("returning signal", { signal, callerID }));
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
    }

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

    // --- NEW: SCREEN SHARE FUNCTION ---
    const shareScreen = () => {
        navigator.mediaDevices.getDisplayMedia({ cursor: true })
            .then(screenStream => {
                const screenTrack = screenStream.getTracks()[0];
                const videoTrack = stream.getVideoTracks()[0];

                // Saare doston (Peers) ko Screen dikhana shuru karo
                peersRef.current.forEach(peer => {
                    // Current Camera track ko Screen track se badal do
                    peer.replaceTrack(videoTrack, screenTrack, stream);
                });

                // Apne khud ke video element mein bhi Screen dikhao
                if (userVideoRef.current) userVideoRef.current.srcObject = screenStream;

                // Jab user "Stop Sharing" button dabaye (Browser wala)
                screenTrack.onended = () => {
                    peersRef.current.forEach(peer => {
                        // Wapis Camera par switch karo
                        peer.replaceTrack(screenTrack, videoTrack, stream);
                    });
                    if (userVideoRef.current) userVideoRef.current.srcObject = stream;
                };
            })
            .catch(err => console.log("Screen Share Error:", err));
    };

    const leaveRoom = () => {
        isLeaving.current = true;
        window.location.reload();
    };

    const getPeerStyle = () => {
        if (!isOneOnOne) return styles.videoCard; 
        return bigMe ? { ...styles.floatingMe, left: pos.x, top: pos.y } : styles.oneOnOnePeer;
    };

    const getMeStyle = () => {
        if (!isOneOnOne) return styles.videoCard; 
        return bigMe ? styles.oneOnOnePeer : { ...styles.floatingMe, left: pos.x, top: pos.y };
    };

    // --- RENDER ---

    if (showSplash) {
        return (
            <div style={styles.splashContainer}>
                <div style={styles.splashContent}>
                    <img src="/logo.png" alt="Logo" style={styles.splashLogo} />
                    <h1 style={styles.splashTitle}>A_Z Video Chat</h1>
                    <div style={styles.loader}></div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container} onMouseMove={handleDragMove} onMouseUp={handleDragEnd}>
            <div style={styles.header}>
                <h2 style={{ margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.2rem" }}>
                    📹 <span style={{ fontWeight: 300 }}>A_Z</span><span style={{ fontWeight: "bold" }}> Video Chat</span>
                </h2>
                {currentUser && !joined && (
                    <button onClick={handleLogout} style={{...styles.roomBadge, border:"none", cursor:"pointer", background: "#ea4335"}}>Logout</button>
                )}
                {joined && <div style={styles.roomBadge}>Room: {roomID}</div>}
            </div>

            {!joined ? (
                <div style={styles.loginContainer}>
                    <img 
                        src="/background-collage.png" 
                        alt="Background Decoration"
                        style={styles.backgroundImage}
                    />

                    {!currentUser ? (
                        <AuthScreen onLogin={handleLoginSuccess} />
                    ) : (
                        <div style={styles.loginCard}>
                            <h2 style={{ color: "white", marginTop: "0", marginBottom: "10px" }}>
                                Hi, {currentUser.name}! 
                            </h2>
                            <h4 style={{ color: "#4CAF50", marginTop: "0", marginBottom: "30px", fontWeight: "normal", fontSize: "18px" }}>
                                Enter Room Name To Talk
                            </h4>
                            <input
                                type="text"
                                name="room"
                                placeholder="Enter Room Name Here"
                                onChange={(e) => setRoomID(e.target.value)}
                                style={styles.input}
                            />
                            <button onClick={joinRoom} style={styles.joinBtn}>Join Now</button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div style={styles.gridContainer}>
                        {peers.map((peer) => {
                            if (!peer.peerID) return null; 
                            return (
                                <Video 
                                    key={peer.peerID} 
                                    peer={peer} 
                                    customStyle={getPeerStyle()} 
                                    onDragStart={getDragHandlers(isOneOnOne && bigMe).onDragStart}
                                    onDragMove={getDragHandlers(isOneOnOne && bigMe).onDragMove}
                                    onDragEnd={getDragHandlers(isOneOnOne && bigMe).onDragEnd}
                                    onClick={bigMe ? toggleView : null}
                                />
                            );
                        })}
                        <div
                            style={getMeStyle()}
                            onClick={!bigMe ? toggleView : null}
                            onMouseDown={getDragHandlers(!bigMe).onDragStart}
                            onTouchStart={getDragHandlers(!bigMe).onDragStart}
                            onTouchMove={getDragHandlers(!bigMe).onDragMove}
                            onTouchEnd={getDragHandlers(!bigMe).onDragEnd}
                        >
                            <video muted ref={userVideoRef} autoPlay playsInline style={styles.videoElement} />
                            {!isOneOnOne && <div style={styles.nameTag}>You ({currentUser.name})</div>}
                            <div style={{ ...styles.statusDot, background: micOn ? "#4CAF50" : "#f44336" }}></div>
                        </div>
                    </div>

                    <div style={styles.controlsBar}>
                        <button onClick={toggleMic} style={{ ...styles.controlBtn, background: micOn ? "#333" : "#ea4335" }}>{micOn ? <Icons.MicOn /> : <Icons.MicOff />}</button>
                        <button onClick={toggleCamera} style={{ ...styles.controlBtn, background: cameraOn ? "#333" : "#ea4335" }}>{cameraOn ? <Icons.CamOn /> : <Icons.CamOff />}</button>
    
                        {/* --- NEW SCREEN SHARE BUTTON --- */}
                        <button onClick={shareScreen} style={{ ...styles.controlBtn, background: "#333" }}>
                        <Icons.ScreenShare />
                        </button>
    
                        <button onClick={switchCamera} style={{ ...styles.controlBtn, background: "#333" }}><Icons.Flip /></button>
                        <button onClick={leaveRoom} style={{ ...styles.controlBtn, background: "#ea4335", width: "60px" }}><Icons.CallEnd /></button>
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    container: { background: "#121212", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif", overflow: "hidden" },
    header: { padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a", borderBottom: "1px solid #333", height: "60px", zIndex: 20 },
    roomBadge: { background: "#333", color: "#fff", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem" },
    
    loginContainer: { 
        flex: 1, display: "flex", justifyContent: "center", alignItems: "center", 
        background: "#000", position: "relative", overflow: "hidden" 
    },
    backgroundImage: {
        position: 'absolute', 
        top: '-15%', left: '-15%', width: '130%', height: '130%', 
        objectFit: 'cover', opacity: 0.3, zIndex: 1,
        animation: 'floatAnimation 18s ease-in-out infinite alternate', 
    },
    loginCard: { 
        background: "rgba(30, 30, 30, 0.9)", backdropFilter: "blur(10px)",
        padding: "30px", borderRadius: "15px", textAlign: "center", 
        width: "90%", maxWidth: "400px", border: "1px solid #444",
        zIndex: 2, position: "relative", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
    },
    
    splashContainer: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: '#000000',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999,
    },
    splashContent: { textAlign: 'center', animation: 'fadeIn 0.5s ease-in-out' },
    splashLogo: {
        width: '120px', height: '120px', borderRadius: '50%',
        boxShadow: '0 0 20px rgba(33, 150, 243, 0.5)', marginBottom: '20px', objectFit: 'cover'
    },
    splashTitle: {
        color: '#fff', fontFamily: 'sans-serif', fontSize: '24px', letterSpacing: '2px', marginBottom: '20px'
    },
    loader: {
        width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)',
        borderLeftColor: '#2196F3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'
    },

    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", background: "#2c2c2c", color: "white", fontSize: "16px", marginBottom: "20px", outline: "none", boxSizing: "border-box" },
    joinBtn: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg, #2196F3, #21CBF3)", color: "white", fontSize: "16px", cursor: "pointer", fontWeight: "bold" },
    
    gridContainer: { flex: 1, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "10px", padding: "10px", paddingBottom: "100px", overflowY: "auto", position: "relative" },
    videoCard: { position: "relative", background: "#000", borderRadius: "12px", overflow: "hidden", border: "1px solid #333", flex: "1 1 40%", minWidth: "140px", maxWidth: "600px", aspectRatio: "1.33", maxHeight: "45vh" },
    oneOnOnePeer: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" },
    floatingMe: { position: "fixed", width: "120px", height: "160px", borderRadius: "10px", overflow: "hidden", border: "2px solid #fff", boxShadow: "0 5px 15px rgba(0,0,0,0.5)", zIndex: 50, background: "#000", cursor: "grab", touchAction: "none" },
    videoElement: { width: "100%", height: "100%", objectFit: "contain", transform: "scaleX(-1)", background: "#000" },
    nameTag: { position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" },
    statusDot: { position: "absolute", top: "10px", right: "10px", width: "8px", height: "8px", borderRadius: "50%" },
    controlsBar: { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(40, 40, 40, 0.9)", padding: "10px 20px", borderRadius: "50px", display: "flex", gap: "15px", zIndex: 100, maxWidth: "95%", overflowX: "auto" },
    controlBtn: { width: "45px", height: "45px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
};

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes floatAnimation { 
            0% { transform: scale(1) translate(0px, 0px); } 
            25% { transform: scale(1.05) translate(-30px, 15px); }
            50% { transform: scale(1.1) translate(10px, -20px); }
            75% { transform: scale(1.05) translate(30px, 10px); }
            100% { transform: scale(1) translate(0px, 0px); } 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    `;
    document.head.appendChild(styleSheet);
}

export default App;