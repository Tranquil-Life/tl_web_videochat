import React from "react";
import {
    useLocalMicrophoneTrack,
    useLocalCameraTrack,
    useJoin,
    usePublish,
    useRemoteUsers,
    LocalVideoTrack,
    RemoteUser
} from 'agora-rtc-react';

import { useEffect } from "react";


export default function Call(props) {
    // Destructure the new props
    const { channelName, appId, token, uid } = props;

    // 1. Get list of other users in the channel
    const remoteUsers = useRemoteUsers();

    // 2. This must be INSIDE the component to work
    useEffect(() => {
        console.log("The list of people in the call has changed:", remoteUsers);
    }, [remoteUsers]);

    // 3. Join the channel using all URL parameters
    useJoin({
        appid: appId,
        channel: channelName,
        token: token, // Use the token from the URL
        uid: uid,     // Use the UID from the URL
    });

    // 4. Create local tracks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack();
    const { localCameraTrack } = useLocalCameraTrack();

    // 5. Publish tracks
    usePublish([localMicrophoneTrack, localCameraTrack]);

  return (
  <div style={{ padding: "20px" }}>
    <h3>Channel: {channelName}</h3>
    
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {/* 1. YOUR VIEW: Always visible */}
      <div style={{ width: "300px", height: "300px", background: "#222", borderRadius: "10px", overflow: "hidden" }}>
        <p style={{ color: "#fff", textAlign: "center" }}>You (Local)</p>
        <LocalVideoTrack track={localCameraTrack} play={true} />
      </div>

      {/* 2. OTHERS: Only visible if remoteUsers.length > 0 */}
      {remoteUsers.length > 0 ? (
        remoteUsers.map((user) => (
          <div key={user.uid} style={{ width: "300px", height: "300px", background: "#000", borderRadius: "10px", overflow: "hidden" }}>
            <p style={{ color: "#fff", textAlign: "center" }}>Remote User: {user.uid}</p>
            <RemoteUser user={user} />
          </div>
        ))
      ) : (
        <div style={{ width: "300px", height: "300px", border: "2px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#999" }}>Waiting for others to join...</p>
        </div>
      )}
    </div>
  </div>
);
}