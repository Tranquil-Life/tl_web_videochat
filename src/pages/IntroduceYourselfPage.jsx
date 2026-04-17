import React, { useRef, useEffect, useState } from "react";

export default function IntroduceYourselfPage() {
    const fileInputRef = useRef(null);

    const [selectedOption, setSelectedOption] = useState("");
    const [introVideo, setIntroVideo] = useState(""); // uploaded/returned video url
    const [profilePic, setProfilePic] = useState("");
    const [showVideoDialog, setShowVideoDialog] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get("videoUrl");

        if (videoUrl) {
            setIntroVideo(videoUrl);
        }
    }, []);

    // replace with your real user data source
    const userName = "Ayomide Ajayi";

    const handleVideoRecordingClick = () => {
        const baseUrl = window.location.origin;

        window.location.href =
            `${baseUrl}?pageType=record-video&userName=${encodeURIComponent(userName)}`;
    };

    const handleProfilePictureClick = () => {
        setSelectedOption("picture");
        fileInputRef.current?.click();
    };

    const handleProfilePictureSelected = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const localUrl = URL.createObjectURL(file);
        setProfilePic(localUrl);

        // if uploading immediately, replace this with your upload logic
        // then store remote URL instead of localUrl
    };

    const handleCompleteSignup = () => {
        if (!introVideo && !profilePic) return;
        // navigate("/docusign");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f7f7f7",
                padding: "24px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: "none",
                        background: "#2e7d32",
                        color: "#fff",
                        fontSize: 22,
                        cursor: "pointer",
                        marginBottom: 24,
                    }}
                >
                    ‹
                </button>

                <h1
                    style={{
                        margin: 0,
                        fontSize: 24,
                        fontWeight: 500,
                        color: "#222",
                    }}
                >
                    Create your account
                </h1>

                <div style={{ marginTop: 42 }}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 500,
                            color: "#222",
                        }}
                    >
                        Introduce yourself
                    </h2>

                    <p
                        style={{
                            marginTop: 8,
                            color: "#777",
                            fontSize: 14,
                        }}
                    >
                        Complete your profile by taking the following steps
                    </p>

                    <div style={{ marginTop: 36 }}>
                        <OptionCard
                            title="Video"
                            subtitle="Record an introductory video"
                            selected={selectedOption === "video"}
                            onClick={handleVideoRecordingClick}
                            icon="📹"
                        />

                        {introVideo && (
                            <button
                                onClick={() => setShowVideoDialog(true)}
                                style={{
                                    marginTop: 8,
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    color: "#2e7d32",
                                    textDecoration: "underline",
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                Play video
                            </button>
                        )}

                        <div style={{ height: 24 }} />

                        <OptionCard
                            title="Profile picture"
                            subtitle="Upload a profile picture for your clients"
                            selected={selectedOption === "picture"}
                            onClick={handleProfilePictureClick}
                            icon="🖼️"
                        />

                        {profilePic && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 8,
                                }}
                            >
                                <button
                                    onClick={() =>
                                        window.open(profilePic, "_blank", "noopener,noreferrer")
                                    }
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        color: "#2e7d32",
                                        textDecoration: "underline",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    Profile preview
                                </button>

                                <button
                                    onClick={() =>
                                        alert("This is what the clients see when they view your profile")
                                    }
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: 16,
                                    }}
                                >
                                    ℹ️
                                </button>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureSelected}
                            style={{ display: "none" }}
                        />

                        <div style={{ height: 80 }} />

                        <button
                            onClick={handleCompleteSignup}
                            disabled={!introVideo && !profilePic}
                            style={{
                                width: "100%",
                                height: 52,
                                borderRadius: 12,
                                border: "1px solid #9ccc9c",
                                background: !introVideo && !profilePic ? "#d9d9d9" : "#2e7d32",
                                color: "#fff",
                                fontSize: 16,
                                fontWeight: 500,
                                cursor: !introVideo && !profilePic ? "not-allowed" : "pointer",
                            }}
                        >
                            Complete sign up
                        </button>

                        <div
                            style={{
                                textAlign: "center",
                                marginTop: 36,
                                color: "#777",
                                fontSize: 16,
                            }}
                        >
                            I have an account.{" "}
                            <span
                                onClick={() => window.location.href = `${window.location.origin}?pageType=sign-in`}
                                style={{
                                    color: "#2e7d32",
                                    cursor: "pointer",
                                }}
                            >
                                Sign me in...
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {showVideoDialog && (
                <VideoPlayerDialog
                    videoUrl={introVideo}
                    onClose={() => setShowVideoDialog(false)}
                />
            )}
        </div>
    );
}

function OptionCard({ title, subtitle, selected, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "22px 18px",
                borderRadius: 14,
                border: `1px solid ${selected ? "#8bc48b" : "#d6e4d6"}`,
                background: "#edf5ee",
                cursor: "pointer",
                textAlign: "left",
            }}
        >
            <div
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    border: "1px solid #6aa56a",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 20,
                    color: "#2e7d32",
                    background: "#f8fff8",
                }}
            >
                {icon}
            </div>

            <div>
                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#333",
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: 14,
                        color: "#6f6f6f",
                        marginTop: 4,
                    }}
                >
                    {subtitle}
                </div>
            </div>
        </button>
    );
}

function VideoPlayerDialog({ videoUrl, onClose }) {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentPosition(video.currentTime || 0);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused && !video.ended);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setCurrentPosition(video.currentTime || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentPosition(video.currentTime || 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPosition(video.currentTime || 0);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    // Safari fallback
    intervalRef.current = setInterval(updateProgress, 250);

    updateProgress();

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoUrl]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error("Playback toggle failed:", error);
    }
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    if (!video) return;

    const nextValue = Number(value);
    video.currentTime = nextValue;
    setCurrentPosition(nextValue);
  };

  const handleDownload = () => {
    if (!videoUrl) return;

    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "intro-video.webm";
    a.click();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Intro Video",
          url: videoUrl,
        });
      } else {
        alert("Share is not supported on this browser.");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 28,
          background: "#fff",
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 18,
            fontWeight: 500,
            color: "#444",
          }}
        >
          <span>📹</span>
          <span>Video recording</span>
        </div>

        <div
          style={{
            height: 1,
            background: "#dcdcdc",
            marginTop: 14,
            marginBottom: 20,
          }}
        />

        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#f3f3f3",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              background: "#fff",
            }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step="0.01"
          value={Math.min(currentPosition, duration || 0)}
          onChange={(e) => handleSeek(e.target.value)}
          style={{
            width: "100%",
            marginTop: 18,
            accentColor: "#9bc79a",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#666",
            fontSize: 14,
            marginTop: 4,
          }}
        >
          <span>{formatDuration(currentPosition)}</span>
          <span>{formatDuration(duration)}</span>
        </div>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button onClick={handleDownload} style={dialogIconButtonStyle}>
            ⬇
          </button>

          <button
            onClick={togglePlayback}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "none",
              background: "#deeedf",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button onClick={handleShare} style={dialogIconButtonStyle}>
            ⤴
          </button>
        </div>
      </div>
    </div>
  );
}

const dialogIconButtonStyle = {
  width: 36,
  height: 36,
  border: "none",
  background: "transparent",
  fontSize: 24,
  cursor: "pointer",
};
