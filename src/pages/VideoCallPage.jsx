import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DailyIframe from "@daily-co/daily-js";
import { FaMicrophone, FaVideo, FaPhone, FaSlash } from "react-icons/fa";

export default function VideoCallPage({ roomUrl, token, userName }) {
  const callRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const listenersRef = useRef({});
  const hasStartedRef = useRef(false);
  const isLocalMainRef = useRef(false);

  const [participants, setParticipants] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isLocalMain, setIsLocalMain] = useState(false); // For labels/icons
  const [dragPos, setDragPos] = useState({ x: 20, y: 20 });

  const { local, remote } = useMemo(() => {
    const p = participants || {};
    return {
      local: p.local || null,
      remote: Object.values(p).find((x) => x && !x.local) || null,
    };
  }, [participants]);

  const destroyCallObject = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;

    Object.entries(listenersRef.current).forEach(([ev, fn]) => {
      if (fn) call.off(ev, fn);
    });

    try {
      await call.destroy();
    } catch (_) {}
    callRef.current = null;
  }, []);

  const refreshParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setParticipants({ ...call.participants() });
  }, []);

  const handleMeetingState = useCallback(
    async (evt) => {
      const call = callRef.current;
      if (!call) return;
      const state = call.meetingState();

      if (evt?.errorMsg) setErrorMsg(String(evt.errorMsg));
      if (state === "error")
        setErrorMsg(
          "Failed to join call. Check room URL / network / permissions."
        );
      if (state === "left-meeting") {
        await destroyCallObject();
        setParticipants({});
      }
    },
    [destroyCallObject]
  );

  const startCall = useCallback(async () => {
    if (!roomUrl || callRef.current) return;

    const call = DailyIframe.createCallObject({
      videoSource: true,
      audioSource: true,
      dailyConfig: { preferredVideoCodec: "vp8" },
    });
    callRef.current = call;

    const onJoined = (evt) => {
      refreshParticipants();
      handleMeetingState(evt);
    };
    const onParticipantUpdate = refreshParticipants;
    const onError = (e) => {
      console.error(e);
      setErrorMsg(e?.errorMsg || "Daily error");
    };

    listenersRef.current = {
      "joined-meeting": onJoined,
      "left-meeting": handleMeetingState,
      "participant-joined": onParticipantUpdate,
      "participant-left": onParticipantUpdate,
      "participant-updated": onParticipantUpdate,
      "track-started": onParticipantUpdate,
      "track-stopped": onParticipantUpdate,
      error: onError,
    };

    Object.entries(listenersRef.current).forEach(([ev, fn]) => call.on(ev, fn));

    try {
      const joinParams = { url: roomUrl, userName };
      if (token && typeof token === "string") joinParams.token = token;

      await call.join(joinParams);
      await call.setLocalVideo(true);
      await call.setLocalAudio(true);
      await call.setBandwidth({ video: 2500 });
      call.updateReceiveSettings({
        base: { receiveSettings: { video: { enabled: true } } },
      });

      refreshParticipants();
      setTimeout(refreshParticipants, 250);
    } catch (e) {
      console.error("Join failed:", e);
      setErrorMsg(e?.message || "Join failed");
      await destroyCallObject();
    }
  }, [
    roomUrl,
    token,
    userName,
    handleMeetingState,
    refreshParticipants,
    destroyCallObject,
  ]);

  const leaveCall = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    try {
      await call.leave();
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Leave failed");
    }
    await destroyCallObject();
  }, [destroyCallObject]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    setCamOn(next);
    try {
      await callRef.current?.setLocalVideo(next);
    } catch (e) {
      setErrorMsg("Could not toggle camera.");
    }
  }, [camOn]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    try {
      await callRef.current?.setLocalAudio(next);
    } catch (e) {
      setErrorMsg("Could not toggle mic.");
    }
  }, [micOn]);

  // Prevent duplicate instance in StrictMode
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startCall();
    return () => {
      hasStartedRef.current = false;
      destroyCallObject();
    };
  }, [startCall, destroyCallObject]);

  // Video element updates
  useEffect(() => {
    if (localVideoRef.current)
      localVideoRef.current.srcObject = local?.tracks?.video?.persistentTrack
        ? new MediaStream([local.tracks.video.persistentTrack])
        : null;
    if (remoteVideoRef.current)
      remoteVideoRef.current.srcObject = remote?.tracks?.video?.persistentTrack
        ? new MediaStream([remote.tracks.video.persistentTrack])
        : null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remote?.tracks?.audio?.persistentTrack
        ? new MediaStream([remote.tracks.audio.persistentTrack])
        : null;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;
    }
  }, [local, remote]);

  const handleDrag = (clientX, clientY) => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const smallW = Math.min(Math.max(120, screenW * 0.22), 160);
    const smallH = (smallW * 3) / 4;
    const x = Math.min(Math.max(clientX - smallW / 2, 8), screenW - smallW - 8);
    const y = Math.min(Math.max(clientY - smallH / 2, 8), screenH - smallH - 8);
    setDragPos({ x, y });
  };

  // ✅ INSTANT SWAP: swap video srcObjects immediately
  const swapVideos = () => {
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;
    if (!localVideo || !remoteVideo) return;

    // Swap srcObjects instantly
    const temp = localVideo.srcObject;
    localVideo.srcObject = remoteVideo.srcObject;
    remoteVideo.srcObject = temp;

    // Update state for labels/icons
    isLocalMainRef.current = !isLocalMainRef.current;
    setIsLocalMain(isLocalMainRef.current);
  };

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const smallW = Math.min(Math.max(120, screenW * 0.22), 160);
      const smallH = (smallW * 3) / 4;
      setDragPos((prev) => ({
        x: Math.min(prev.x, screenW - smallW - 8),
        y: Math.min(prev.y, screenH - smallH - 8),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.page}>
      <main style={styles.videoContainer}>
        <video
          ref={isLocalMain ? localVideoRef : remoteVideoRef}
          autoPlay
          playsInline
          muted={isLocalMain}
          style={styles.mainVideo}
        />

        <div
          style={{
            ...styles.smallVideoWrapper,
            top: dragPos.y,
            left: dragPos.x,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const move = (ev) => handleDrag(ev.clientX, ev.clientY);
            const stop = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", stop);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", stop);
          }}
          onTouchStart={(e) => {
            const touchMove = (ev) =>
              handleDrag(ev.touches[0].clientX, ev.touches[0].clientY);
            const stop = () => {
              window.removeEventListener("touchmove", touchMove);
              window.removeEventListener("touchend", stop);
            };
            window.addEventListener("touchmove", touchMove);
            window.addEventListener("touchend", stop);
          }}
          onDoubleClick={swapVideos}
        >
          <video
            ref={isLocalMain ? remoteVideoRef : localVideoRef}
            autoPlay
            playsInline
            muted={!isLocalMain}
            style={styles.smallVideo}
          />
          <div style={styles.smallLabel}>{isLocalMain ? "Remote" : "You"}</div>
        </div>

        <div style={styles.controls}>
          <button onClick={toggleMic} style={styles.controlBtn}>
            <div style={styles.iconBox}>
              <FaMicrophone /> {!micOn && <FaSlash style={styles.slashIcon} />}
            </div>
          </button>

          <button
            onClick={leaveCall}
            style={{ ...styles.controlBtn, background: "red" }}
          >
            <FaPhone />
          </button>

          <button onClick={toggleCam} style={styles.controlBtn}>
            <div style={styles.iconBox}>
              <FaVideo /> {!camOn && <FaSlash style={styles.slashIcon} />}
            </div>
          </button>
        </div>

        {errorMsg && <div style={styles.bottomError}>{errorMsg}</div>}
      </main>

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}

// --- STYLES ---
const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    background: "#0b0f19",
    color: "white",
    overflow: "hidden",
  },
  videoContainer: { height: "100%", width: "100%", position: "relative" },
  mainVideo: { width: "100%", height: "100%", objectFit: "cover" },
  smallVideoWrapper: {
    position: "absolute",
    width: "clamp(120px,22vw,160px)",
    aspectRatio: "4/3",
    border: "2px solid white",
    borderRadius: 8,
    cursor: "grab",
    zIndex: 10,
    background: "black",
  },
  smallVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 6,
  },
  smallLabel: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "rgba(0,0,0,0.35)",
    padding: "2px 6px",
    borderRadius: 999,
    fontSize: 11,
  },
  controls: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 16,
    zIndex: 20,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconBox: {
    position: "relative",
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  slashIcon: {
    position: "absolute",
    fontSize: 28,
    color: "white",
    pointerEvents: "none",
  },
  bottomError: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 16px",
    background: "rgba(255,80,80,0.85)",
    color: "white",
    borderRadius: 8,
    zIndex: 30,
    maxWidth: "90%",
    textAlign: "center",
    fontSize: 14,
  },
};