import React from "react";

const ChatBox = ({
    isChatFullScreen,
    setIsChatFullScreen,
    setShowChat,
    messages,
    currentUser,
    setSelectedImage,
    handleFileChange,
    message,
    setMessage,
    sendMessage
}) => {
    return (
        <div className={`chat-box ${isChatFullScreen ? "fullscreen" : ""}`}>
            <div className="chat-header">
                <h3>💬 Chat</h3>
                <div>
                    <button
                        onClick={() => setIsChatFullScreen(!isChatFullScreen)}
                        className="chat-expand-btn"
                    >
                        {isChatFullScreen ? "🔽 Small" : "⤢ Full"}
                    </button>
                    <button onClick={() => setShowChat(false)} className="chat-close-btn">
                        ✕
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg, index) => {
                    const isOwn = msg.user === (currentUser?.name || "User");
                    return (
                        <div key={index} className={`chat-msg-row ${isOwn ? "own" : ""}`}>
                            <div className="chat-bubble">
                                <strong className="chat-sender">{msg.user}</strong>
                                {msg.type === "file" ? (
                                    <img
                                        src={msg.file}
                                        alt="attachment"
                                        onClick={() => setSelectedImage(msg.file)}
                                        className="chat-attachment"
                                    />
                                ) : (
                                    <p className="chat-text">{msg.text}</p>
                                )}
                                <span className="chat-time">{msg.time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="chat-input-area">
                <label className="file-upload-label">
                    📎
                    <input type="file" onChange={handleFileChange} className="hidden-file-input" />
                </label>
                <input
                    type="text"
                    placeholder="Message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => (e.key === "Enter" ? sendMessage(e) : null)}
                    className="chat-input"
                />
                <button onClick={sendMessage} className="chat-send-btn">
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatBox;