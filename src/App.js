import React from 'react';
// import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
// import Call from "./components/Call";
import VideoCallPage from "./pages/VideoCallPage";

// const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
function App() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");

  const roomUrl = room
    ? `https://skpnation.daily.co/${room}`
    : null;

  return (
    <>
      {roomUrl ? (
        <VideoCallPage roomUrl={roomUrl} />
      ) : (
        <div style={{ color: "black", padding: 20 }}>
          ❌ No room provided in URL
        </div>
      )}
    </>
  );
}
export default App;