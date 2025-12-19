import React, { useEffect, useState, useMemo } from "react";
import {
    useLocalMicrophoneTrack,
    useLocalCameraTrack,
    useJoin,
    usePublish,
    useRemoteUsers,
    useIsConnected,
    LocalVideoTrack,
    RemoteUser
} from 'agora-rtc-react';
import { Mic, MicOff, Video, VideoOff, Users, User, LogOut } from "./Icons";

export default function Call(props) {
    const { channelName, appId, token, uid } = props;

    // 1. Connection status & Toggles
    const isConnected = useIsConnected();
    const remoteUsers = useRemoteUsers();

    // Media Toggles
    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(true);

    // 2. Logging for debugging
    useEffect(() => {
        console.log("[Call] Component Mounted. Props:", {
            channelName,
            appId: appId ? "Present" : "Missing",
            token: token ? "Present" : "Null/Missing",
            uid
        });
    }, [channelName, appId, token, uid]);

    useEffect(() => {
        if (isConnected) {
            console.log("[Call] Connection established successfully");
        }
    }, [isConnected]);

    useEffect(() => {
        console.log("[Call] Remote Users Update:", remoteUsers.length, "users present");
    }, [remoteUsers]);

    // 3. Join the channel
    useJoin({
        appid: appId,
        channel: channelName,
        token: token,
        uid: uid ? Number(uid) : null,
    }, true);

    // 4. Create local tracks
    const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack, error: camError } = useLocalCameraTrack(cameraOn);

    // 5. Stable publishing
    const tracksToPublish = useMemo(() => {
        const tracks = [];
        if (localMicrophoneTrack) tracks.push(localMicrophoneTrack);
        if (localCameraTrack) tracks.push(localCameraTrack);
        return tracks;
    }, [localMicrophoneTrack, localCameraTrack]);

    usePublish(tracksToPublish);

    // Track errors
    useEffect(() => {
        if (micError) console.error("[Call] Microphone Error:", micError);
        if (camError) console.error("[Call] Camera Error:", camError);
    }, [micError, camError]);

    return (
        <div style={{
            padding: "20px",
            fontFamily: "'Inter', sans-serif",
            height: "calc(100vh - 40px)",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Header Area */}
            <div style={{
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                padding: "15px 25px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1a1a1a" }}>
                        Channel: <span style={{ color: "#007bff" }}>{channelName}</span>
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                        <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isConnected ? "#28a745" : "#f39c12"
                        }} />
                        <span style={{ color: isConnected ? "#28a745" : "#f39c12", fontWeight: "600", fontSize: "14px" }}>
                            {isConnected ? "Live Connection" : "Establishing..."}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "13px", color: "#6c757d" }}>
                    Session ID: <code style={{ background: "#f8f9fa", padding: "2px 6px" }}>{uid || "Auto"}</code>
                </div>
            </div>

            {/* Video Grid */}
            <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "20px",
                overflowY: "auto",
                paddingBottom: "100px" // Space for control bar
            }}>
                {/* LOCAL USER VIEW */}
                <div style={videoCardStyle}>
                    <LocalVideoTrack
                        track={localCameraTrack}
                        play={cameraOn}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {!cameraOn && <VideoOffPlaceholder name="You" />}
                    <div style={badgeStyle}>
                        <span>You (Local)</span>
                        {!micOn && <span style={{ marginLeft: "8px", display: "inline-flex" }}><MicOff size={14} color="white" /></span>}
                    </div>
                </div>

                {/* REMOTE USERS VIEW */}
                {remoteUsers.map((user) => (
                    <div key={user.uid} style={videoCardStyle}>
                        <RemoteUser user={user} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={badgeStyle}>Remote User: {user.uid}</div>
                    </div>
                ))}

                {/* PLACEHOLDER IF ALONE */}
                {remoteUsers.length === 0 && (
                    <div style={{
                        ...videoCardStyle,
                        background: "#f8f9fa",
                        border: "2px dashed #dee2e6",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#adb5bd"
                    }}>
                        <div style={{ marginBottom: "15px", opacity: 0.5 }}>
                            <Users size={48} />
                        </div>
                        <p style={{ margin: 0, fontWeight: "500" }}>Waiting for others to join...</p>
                        <p style={{ fontSize: "12px", marginTop: "10px" }}>Share your App ID and Channel Name</p>
                    </div>
                )}
            </div>

            {/* CONTROL BAR */}
            <div style={{
                position: "fixed",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "15px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                padding: "12px 25px",
                borderRadius: "50px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                zIndex: 100,
                border: "1px solid rgba(255,255,255,0.3)"
            }}>
                <ControlButton
                    onClick={() => setMic(!micOn)}
                    active={micOn}
                    icon={micOn ? <Mic /> : <MicOff />}
                    label={micOn ? "Mute" : "Unmute"}
                />
                <ControlButton
                    onClick={() => setCamera(!cameraOn)}
                    active={cameraOn}
                    icon={cameraOn ? <Video /> : <VideoOff />}
                    label={cameraOn ? "Stop Video" : "Start Video"}
                />
                <div style={{ width: "1px", background: "#ddd", margin: "0 5px" }} />
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "25px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = "#bd2130"}
                    onMouseOut={(e) => e.target.style.background = "#dc3545"}
                >
                    <LogOut size={18} /> Leave
                </button>
            </div>
        </div>
    );
}

// --- Internal UI Components & Styles ---

const videoCardStyle = {
    background: "#000",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    position: "relative",
    aspectRatio: "16/9",
    transition: "transform 0.3s ease"
};

const badgeStyle = {
    position: "absolute",
    bottom: "15px",
    left: "15px",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center"
};

function VideoOffPlaceholder({ name }) {
    return (
        <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#2c3e50",
            color: "#ecf0f1",
            flexDirection: "column"
        }}>
            <div style={{ marginBottom: "10px", opacity: 0.5 }}>
                <User size={64} />
            </div>
            <p style={{ margin: 0, fontWeight: "500" }}>Video Paused</p>
        </div>
    );
}

function ControlButton({ onClick, active, icon, label }) {
    return (
        <button
            onClick={onClick}
            title={label}
            style={{
                background: active ? "#f8f9fa" : "#343a40",
                color: active ? "#343a40" : "#fff",
                border: "none",
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
        >
            {icon}
        </button>
    );
}