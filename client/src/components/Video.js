import React, { useEffect, useRef, useState } from "react";

const Video = (props) => {
    const ref = useRef();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const peer = props.peer;
        const handleStream = (stream) => {
            if (ref.current) ref.current.srcObject = stream;
        };

        if (peer) {
            peer.on("stream", handleStream);
            if (peer._remoteStreams && peer._remoteStreams.length > 0) {
                if (ref.current) ref.current.srcObject = peer._remoteStreams[0];
            }
            peer.on("close", () => setIsVisible(false));
            peer.on("error", () => setIsVisible(false));
        }

        return () => {
            if (peer) peer.off("stream", handleStream);
        };
    }, [props.peer]);

    if (!isVisible) return null;

    return (
        <div
            className={props.className || "video-card"}
            style={props.style}
            onMouseDown={props.onDragStart}
            onMouseMove={props.onDragMove}
            onMouseUp={props.onDragEnd}
            onTouchStart={props.onDragStart}
            onTouchMove={props.onDragMove}
            onTouchEnd={props.onDragEnd}
            onClick={props.onClick}
        >
            <video playsInline autoPlay ref={ref} className="video-element" />
            <div className="name-tag">User</div>
        </div>
    );
};

export default Video;