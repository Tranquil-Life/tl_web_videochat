import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";

/**
 * Minimal 1–1 Daily.co call page using the Daily Call Object API.
 *
 * Props:
 * - roomUrl: string (e.g. "https://your-team.daily.co/room-name")
 *   IMPORTANT: Create rooms from your backend (don’t expose API keys in client).
 */
export default function VideoCallPage({ roomUrl }) {
  const callRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Meeting state: "new" | "joining-meeting" | "joined-meeting" | "left-meeting" | "error"
  const [meetingState, setMeetingState] = useState("new");
  const [participants, setParticipants] = useState({}); // from callObject.participants()
  const [errorMsg, setErrorMsg] = useState("");

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const isInCall = meetingState === "joined-meeting";
  const isJoining = meetingState === "joining-meeting";
  const canJoin = meetingState === "new" || meetingState === "left-meeting" || meetingState === "error";
  const canLeave = meetingState === "joined-meeting" || meetingState === "error";

  // Identify the remote participant (for strict 1–1 UI)
  const { local, remote } = useMemo(() => {
    const p = participants || {};
    const localP = p.local || null;
    const remoteP = Object.values(p).find((x) => x && !x.local) || null;
    return { local: localP, remote: remoteP };
  }, [participants]);

const destroyCallObject = useCallback(async () => {
  const call = callRef.current;
  if (!call) return;

  try {
    call.off("joined-meeting");
    call.off("left-meeting");
    call.off("error");
    call.off("participant-joined");
    call.off("participant-left");
    call.off("participant-updated");
    call.off("track-started");   // ✅ add
    call.off("track-stopped");   // ✅ add
  } catch (_) {}

  try {
    await call.destroy();
  } catch (_) {}

  callRef.current = null;
}, []);

  const refreshParticipants = useCallback(() => {
  const call = callRef.current;
  if (!call) return;

  const p = call.participants();
  console.log("participants:", p);

  // ✅ IMPORTANT: clone so React sees a new reference and re-renders
  setParticipants({ ...p });
  }, []);


  const handleMeetingState = useCallback(
    async (evt) => {
      const call = callRef.current;
      if (!call) return;

      const state = call.meetingState();
      setMeetingState(state);

      if (evt?.errorMsg) setErrorMsg(String(evt.errorMsg));
      if (state === "error") setErrorMsg("Failed to join call. Check room URL / network / permissions.");

      if (state === "left-meeting") {
        // We destroy after leaving so next join is clean (pattern used in Daily tutorial)
        await destroyCallObject();
        setParticipants({});
      }
    },
    [destroyCallObject]
  );

const startCall = useCallback(async () => {
  if (!roomUrl) {
    setErrorMsg("Missing roomUrl.");
    return;
  }

  setErrorMsg("");
  setMeetingState("joining-meeting");

  const call = DailyIframe.createCallObject({
     videoSource: true,
  audioSource: true,
  dailyConfig: {
    // Prefer quality over bandwidth savings
    preferredVideoCodec: "vp8",
  },
  });
  callRef.current = call;

  // ✅ helper: refresh + set meeting state
  const onJoined = (evt) => {
    refreshParticipants();       // ✅ critical
    handleMeetingState(evt);
  };

  // Meeting events
  call.on("joined-meeting", onJoined);          // ✅ swapped to onJoined
  call.on("left-meeting", handleMeetingState);

  call.on("error", (e) => {
    console.error("Daily error event:", e);
    setErrorMsg(e?.errorMsg || "Daily error.");
    setMeetingState("error");
  });

  // Participant events
  call.on("participant-joined", refreshParticipants);
  call.on("participant-left", refreshParticipants);
  call.on("participant-updated", refreshParticipants);

  // ✅ Track events (often needed for remote video to appear)
  call.on("track-started", refreshParticipants);
  call.on("track-stopped", refreshParticipants);

  try {
    await call.join({ url: roomUrl });
    
    await call.setBandwidth({
    video: 2500, // kbps (try 1500–2500)
  });


  await call.setLocalVideo(true);

call.updateReceiveSettings({
  base: {
    receiveSettings: {
      video: {
        enabled: true,
      },
    },
  },
});

    // ✅ critical: in case the other person was already inside
    refreshParticipants();

    // ✅ optional: sometimes a tiny delay helps if tracks arrive right after join
    setTimeout(refreshParticipants, 250);
  } catch (e) {
    console.error("join() failed:", e);
    setErrorMsg(e?.message || "Join failed.");
    setMeetingState("error");
    await destroyCallObject();
  }
}, [roomUrl, handleMeetingState, refreshParticipants, destroyCallObject]);


  const leaveCall = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;

    setErrorMsg("");
    try {
      await call.leave(); // will trigger left-meeting event
    } catch (e) {
      console.error("leave() failed:", e);
      setErrorMsg(e?.message || "Leave failed.");
      setMeetingState("error");
      await destroyCallObject();
    }
  }, [destroyCallObject]);

  // Attach tracks to <video> elements for a fully custom UI
  useEffect(() => {
    // Local
    const localTrack = local?.tracks?.video?.persistentTrack;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localTrack ? new MediaStream([localTrack]) : null;
    }

    // Remote
    const remoteTrack = remote?.tracks?.video?.persistentTrack;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteTrack ? new MediaStream([remoteTrack]) : null;
    }

      // ✅ Remote audio (NEW)
  const remoteAudioTrack = remote?.tracks?.audio?.persistentTrack;
  if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = remoteAudioTrack ? new MediaStream([remoteAudioTrack]) : null;
    remoteAudioRef.current.muted = false;
    remoteAudioRef.current.volume = 1;
  }

    console.log("remote video state:", remote?.tracks?.video);
    console.log("remote persistentTrack:", remote?.tracks?.video?.persistentTrack);

    console.log("LOCAL audio:", local?.tracks?.audio);
    console.log("REMOTE audio:", remote?.tracks?.audio);
  }, [local, remote]);

  // Toggle camera/mic using updateLocalParticipant
  const toggleCam = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;

    const next = !camOn;
    setCamOn(next);

    try {
      // "video": true/false turns camera on/off for the local participant
      await call.setLocalVideo(next);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not toggle camera.");
    }
  }, [camOn]);

  const toggleMic = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;

    const next = !micOn;
    setMicOn(next);

    try {
      await call.setLocalAudio(next);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not toggle mic.");
    }
  }, [micOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // leave & destroy if component unmounts
      (async () => {
        try {
          await callRef.current?.leave();
        } catch (_) {}
        await destroyCallObject();
      })();
    };
  }, [destroyCallObject]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>Video Session</div>
          <div style={styles.subTitle}>
            State: <b>{meetingState}</b>
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...(canJoin ? {} : styles.btnDisabled) }}
            disabled={!canJoin || isJoining}
            onClick={startCall}
          >
            {isJoining ? "Joining..." : "Join"}
          </button>

          <button
            style={{ ...styles.btn, ...(canLeave ? {} : styles.btnDisabled) }}
            disabled={!canLeave}
            onClick={leaveCall}
          >
            Leave
          </button>

          <button style={{ ...styles.btn }} disabled={!isInCall} onClick={toggleMic}>
            {micOn ? "Mute" : "Unmute"}
          </button>

          <button style={{ ...styles.btn }} disabled={!isInCall} onClick={toggleCam}>
            {camOn ? "Camera off" : "Camera on"}
          </button>
        </div>
      </header>

      {errorMsg ? <div style={styles.error}>⚠️ {errorMsg}</div> : null}

      <main style={styles.grid}>
        <section style={styles.tile}>
          <div style={styles.label}>Remote</div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={styles.video}
          />
          {!remote ? <div style={styles.hint}>Waiting for the other user…</div> : null}
        </section>

        <section style={styles.tile}>
          <div style={styles.label}>You</div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />
          {!local ? <div style={styles.hint}>Join to start your camera…</div> : null}
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={styles.small}>
          Tip: For production, create rooms & tokens on your backend (don’t store Daily API keys in React).
        </div>
      </footer>

      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0f19",
    color: "white",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  header: {
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: 700 },
  subTitle: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  btn: {
    background: "rgba(255,255,255,0.12)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  error: {
    margin: "12px 18px 0",
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,80,80,0.25)",
  },
  grid: {
    padding: 18,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  tile: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    minHeight: 360,
  },
  label: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    zIndex: 2,
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  hint: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    fontSize: 13,
    opacity: 0.85,
    background: "rgba(0,0,0,0.35)",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  footer: {
    padding: "0 18px 18px",
    opacity: 0.7,
  },
  small: { fontSize: 12 },
};
