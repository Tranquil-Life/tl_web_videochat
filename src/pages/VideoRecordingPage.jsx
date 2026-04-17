import React, { useEffect, useMemo, useRef, useState } from "react";
import { uploadIntroVideoRecording } from "../services/videoUploadService";

const RECORDING_DURATION_MS = 20_000; // 20 seconds

export default function VideoRecordingPage({ userName }) {
    const videoPreviewRef = useRef(null);
    const playbackRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const autoStopTimerRef = useRef(null);
    const progressTimerRef = useRef(null);

    // add these refs
    const isRecordingRef = useRef(false);
    const didFinishRecordingRef = useRef(false);
    const isStoppingRecordingRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [inVideoPlayerState, setInVideoPlayerState] = useState(false);
    const [didFinishRecording, setDidFinishRecording] = useState(false);
    const [isStoppingRecording, setIsStoppingRecording] = useState(false);

    const [recordedBlob, setRecordedBlob] = useState(null);
    const [videoUrl, setVideoUrl] = useState("");
    const [progress, setProgress] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

    const uploadStateText = useMemo(() => {
        return "Save video and upload";
    }, []);

    // keep refs in sync with state
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        didFinishRecordingRef.current = didFinishRecording;
    }, [didFinishRecording]);

    useEffect(() => {
        isStoppingRecordingRef.current = isStoppingRecording;
    }, [isStoppingRecording]);

    useEffect(() => {
        let mounted = true;

        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: true,
                });

                if (!mounted) return;

                streamRef.current = stream;
                setIsLoading(false);
            } catch (error) {
                console.error("Camera init error:", error);
                setIsLoading(false);
            }
        }

        initCamera();

        const currentPlayback = playbackRef.current;

        return () => {
            mounted = false;
            clearTimers();

            if (currentPlayback) {
                currentPlayback.pause();
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        const preview = videoPreviewRef.current;
        const stream = streamRef.current;

        if (!preview || !stream || inVideoPlayerState) return;

        preview.srcObject = stream;
        preview.muted = true;
        preview.defaultMuted = true;
        preview.playsInline = true;
        preview.autoplay = true;

        const startPreview = async () => {
            try {
                await preview.play();
            } catch (error) {
                console.error("Preview play error:", error);
            }
        };

        if (preview.readyState >= 1) {
            startPreview();
        } else {
            preview.onloadedmetadata = () => {
                startPreview();
            };
        }

        return () => {
            preview.onloadedmetadata = null;
        };
    }, [isLoading, inVideoPlayerState, isRecording]);

    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);

    useEffect(() => {
        const video = playbackRef.current;
        if (!video) return;

        const safeDurationMs = () => {
            const raw = video.duration;
            if (!Number.isFinite(raw) || Number.isNaN(raw) || raw <= 0) {
                return RECORDING_DURATION_MS;
            }
            return Math.min(raw * 1000, RECORDING_DURATION_MS);
        };

        const onTimeUpdate = () => {
            const next = Math.min(video.currentTime * 1000, RECORDING_DURATION_MS);
            setCurrentPosition(next);

            if (video.currentTime * 1000 >= RECORDING_DURATION_MS) {
                video.pause();
            }
        };

        const onLoadedMetadata = () => {
            setDuration(safeDurationMs());
        };

        const onDurationChange = () => {
            setDuration(safeDurationMs());
        };

        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("durationchange", onDurationChange);

        return () => {
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("durationchange", onDurationChange);
        };
    }, [videoUrl, inVideoPlayerState]);

    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const clearTimers = () => {
        if (autoStopTimerRef.current) {
            clearTimeout(autoStopTimerRef.current);
            autoStopTimerRef.current = null;
        }

        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
    };

    const startProgressAnimation = () => {
        const startedAt = Date.now();
        setProgress(0);

        progressTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const next = Math.min(elapsed / RECORDING_DURATION_MS, 1);
            setProgress(next);

            if (next >= 1) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
            }
        }, 100);
    };

    const buildRecorder = (stream) => {
        const preferredTypes = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
            "video/mp4",
        ];

        const mimeType = preferredTypes.find((type) =>
            window.MediaRecorder?.isTypeSupported?.(type)
        );

        return new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    };

    const startRecording = async () => {
        if (
            isRecordingRef.current ||
            isStoppingRecordingRef.current ||
            !streamRef.current
        ) {
            return;
        }

        try {
            clearTimers();

            if (playbackRef.current) {
                playbackRef.current.pause();
                playbackRef.current.removeAttribute("src");
                playbackRef.current.load();
            }

            chunksRef.current = [];
            setRecordedBlob(null);
            setCurrentPosition(0);
            setDuration(0);
            setInVideoPlayerState(false);

            setVideoUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return "";
            });

            setDidFinishRecording(false);
            didFinishRecordingRef.current = false;

            const recorder = buildRecorder(streamRef.current);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || "video/webm",
                });

                const localUrl = URL.createObjectURL(blob);

                setRecordedBlob(blob);
                setVideoUrl(localUrl);
                setIsRecording(false);
                isRecordingRef.current = false;
            };

            recorder.start();

            setIsRecording(true);
            isRecordingRef.current = true;

            setProgress(0);
            startProgressAnimation();

            autoStopTimerRef.current = setTimeout(() => {
                autoStopRecordingOnly();
            }, RECORDING_DURATION_MS);
        } catch (error) {
            console.error("startRecording error:", error);
        }
    };

    const autoStopRecordingOnly = async () => {
        if (
            !isRecordingRef.current ||
            isStoppingRecordingRef.current ||
            didFinishRecordingRef.current
        ) {
            return;
        }

        setIsStoppingRecording(true);
        isStoppingRecordingRef.current = true;

        setDidFinishRecording(true);
        didFinishRecordingRef.current = true;

        clearTimers();
        setProgress(1);

        try {
            const recorder = mediaRecorderRef.current;

            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }
        } catch (error) {
            console.error("autoStopRecordingOnly error:", error);
        } finally {
            setIsStoppingRecording(false);
            isStoppingRecordingRef.current = false;
        }
    };

    const stopRecordingAndOpenPlayer = async () => {
        if (isStoppingRecordingRef.current) return;

        clearTimers();

        try {
            if (isRecordingRef.current && !didFinishRecordingRef.current) {
                setIsStoppingRecording(true);
                isStoppingRecordingRef.current = true;

                setDidFinishRecording(true);
                didFinishRecordingRef.current = true;

                await new Promise((resolve) => {
                    const recorder = mediaRecorderRef.current;

                    if (!recorder || recorder.state === "inactive") {
                        resolve();
                        return;
                    }

                    const previousOnStop = recorder.onstop;

                    recorder.onstop = (...args) => {
                        if (typeof previousOnStop === "function") {
                            previousOnStop(...args);
                        }
                        resolve();
                    };

                    recorder.stop();
                });
            }

            setIsRecording(false);
            isRecordingRef.current = false;

            // wait one tick so React applies the new videoUrl first
            setTimeout(() => {
                setInVideoPlayerState(true);

                setTimeout(() => {
                    if (playbackRef.current) {
                        playbackRef.current.currentTime = 0;
                        playbackRef.current.load();
                        playbackRef.current.play().catch(() => { });
                    }
                }, 0);
            }, 0);
        } catch (error) {
            console.error("stopRecordingAndOpenPlayer error:", error);
        } finally {
            setIsStoppingRecording(false);
            isStoppingRecordingRef.current = false;
        }
    };

    const retakeVideo = async () => {
        clearTimers();

        if (playbackRef.current) {
            playbackRef.current.pause();
            playbackRef.current.removeAttribute("src");
            playbackRef.current.load();
        }

        setVideoUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
        });

        chunksRef.current = [];
        setRecordedBlob(null);
        setCurrentPosition(0);
        setDuration(0);
        setDidFinishRecording(false);
        didFinishRecordingRef.current = false;
        setInVideoPlayerState(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        setProgress(0);

        if (videoPreviewRef.current && streamRef.current) {
            videoPreviewRef.current.srcObject = streamRef.current;
            await videoPreviewRef.current.play().catch(() => { });
        }
    };

    const togglePlayback = async () => {
        const video = playbackRef.current;
        if (!video) return;

        if (video.paused) {
            await video.play().catch(() => { });
        } else {
            video.pause();
        }
    };

    const handleSeek = (value) => {
        const video = playbackRef.current;
        if (!video) return;

        const maxMs =
            Number.isFinite(duration) && duration > 0
                ? duration
                : RECORDING_DURATION_MS;

        const nextMs = Math.min(Number(value), maxMs);
        setCurrentPosition(nextMs);
        video.currentTime = nextMs / 1000;
    };

    const handleUpload = async () => {
        if (!recordedBlob) {
            alert("No recorded video to upload");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // fallback to username if user.id is null
            const userId = userName || "anonymous";

            const result = await uploadIntroVideoRecording({
                videoBlob: recordedBlob,
                userId,
                previousUrl: null, // add real previous URL if you have it
                onProgress: (progressValue) => {
                    setUploadProgress(progressValue);
                },
            });

            if (!result) {
                alert("Upload failed");
                return;
            }

            const { downloadUrl } = result;

            setUploadedVideoUrl(downloadUrl);


            // redirect back to Flutter web route
            // send to Flutter
            // window.parent.postMessage(
            //     {
            //         type: "VIDEO_UPLOAD_SUCCESS",
            //         videoUrl: downloadUrl,
            //     },
            //     "*"
            // );

            console.log("Uploaded video URL:", downloadUrl);
            alert("Upload successful");

            // ✅ redirect back to introduce page with video
            window.location.href =
                `${window.location.origin}?pageType=video-recording&videoUrl=${encodeURIComponent(downloadUrl)}`;

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = () => {
        if (!videoUrl) return;

        const a = document.createElement("a");
        a.href = videoUrl;
        a.download = "recorded-video.webm";
        a.click();
    };

    const handleShare = async () => {
        try {
            if (!recordedBlob) return;

            const file = new File([recordedBlob], "recorded-video.webm", {
                type: recordedBlob.type || "video/webm",
            });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "Recorded Video",
                    files: [file],
                });
            } else {
                alert("Share is not supported on this browser.");
            }
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f6f7f9",
                position: "relative",
                color: "#111",
            }}
        >
            <button
                onClick={() => window.history.back()}
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: "999px",
                    border: "none",
                    background: "#fff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                }}
            >
                ✕
            </button>

            <div style={{ maxWidth: 900, margin: "0 auto", padding: "70px 16px 32px" }}>
                {isUploading && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: 16,
                            borderRadius: 12,
                            background: "#fff",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            <span>Uploading video...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>

                        <div
                            style={{
                                width: "100%",
                                height: 10,
                                borderRadius: 999,
                                background: "#e5e7eb",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${uploadProgress}%`,
                                    height: "100%",
                                    background: "green",
                                    transition: "width 0.2s ease",
                                }}
                            />
                        </div>
                    </div>
                )}

                {!inVideoPlayerState ? (
                    <>
                        <div
                            style={{
                                width: "100%",
                                height: 420,
                                background: "#000",
                                borderRadius: 16,
                                overflow: "hidden",
                            }}
                        >
                            <video
                                ref={videoPreviewRef}
                                muted
                                autoPlay
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: "scaleX(-1)",
                                    display: "block",
                                    background: "#000",
                                }}
                            />
                        </div>

                        <div
                            style={{
                                marginTop: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 24,
                            }}
                        >
                            <div style={{ width: 40 }} />

                            <button
                                onClick={() => {
                                    if (didFinishRecording) {
                                        stopRecordingAndOpenPlayer();
                                    } else {
                                        startRecording();
                                    }
                                }}
                                style={{
                                    position: "relative",
                                    width: 72,
                                    height: 72,
                                    borderRadius: "999px",
                                    border: "6px solid #b7e4c7",
                                    background: "#fff",
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: "pointer",
                                }}
                            >
                                {didFinishRecording ? (
                                    <span style={{ fontSize: 24 }}>▶</span>
                                ) : (
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "999px",
                                            background: "green",
                                        }}
                                    />
                                )}

                                {isRecording && (
                                    <svg
                                        viewBox="0 0 36 36"
                                        style={{
                                            position: "absolute",
                                            inset: -2,
                                            width: 68,
                                            height: 68,
                                            transform: "rotate(-90deg)",
                                        }}
                                    >
                                        <path
                                            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                            fill="none"
                                            stroke="#d9f2df"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                            fill="none"
                                            stroke="green"
                                            strokeWidth="3"
                                            strokeDasharray={`${progress * 100}, 100`}
                                        />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={stopRecordingAndOpenPlayer}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "999px",
                                    border: "1px solid green",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: 16,
                                }}
                            >
                                ■
                            </button>
                        </div>

                        <div
                            style={{
                                textAlign: "center",
                                marginTop: 16,
                                color: "#555",
                                fontSize: 14,
                            }}
                        >
                            {isRecording
                                ? `Recording... ${Math.max(
                                    0,
                                    Math.ceil(((1 - progress) * RECORDING_DURATION_MS) / 1000)
                                )}s left`
                                : didFinishRecording
                                    ? "Recording finished. Tap play or stop to preview."
                                    : "Tap the record button to start."}
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            style={{
                                width: "100%",
                                background: "#000",
                                borderRadius: 16,
                                overflow: "hidden",
                            }}
                        >
                            <video
                                key={videoUrl}
                                ref={playbackRef}
                                src={videoUrl}
                                loop
                                playsInline
                                style={{
                                    width: "100%",
                                    maxHeight: 500,
                                    display: "block",
                                }}
                            />
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={
                                Number.isFinite(duration) && duration > 0
                                    ? duration
                                    : RECORDING_DURATION_MS
                            }
                            value={Math.min(
                                currentPosition,
                                Number.isFinite(duration) && duration > 0
                                    ? duration
                                    : RECORDING_DURATION_MS
                            )}
                            onChange={(e) => handleSeek(e.target.value)}
                            style={{
                                width: "100%",
                                marginTop: 16,
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 8,
                                fontSize: 14,
                            }}
                        >
                            <span>{formatDuration(currentPosition)}</span>
                            <span>
                                {formatDuration(
                                    Number.isFinite(duration) && duration > 0
                                        ? duration
                                        : RECORDING_DURATION_MS
                                )}
                            </span>
                        </div>

                        <div
                            style={{
                                marginTop: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <button onClick={handleDownload} style={iconButtonStyle}>
                                ⬇
                            </button>

                            <button
                                onClick={togglePlayback}
                                style={{
                                    ...iconButtonStyle,
                                    width: 60,
                                    height: 60,
                                    background: "#dff3e4",
                                    fontSize: 22,
                                }}
                            >
                                {playbackRef.current?.paused ?? true ? "▶" : "❚❚"}
                            </button>

                            <button onClick={handleShare} style={iconButtonStyle}>
                                ⤴
                            </button>
                        </div>

                        <div style={{ marginTop: 40, display: "grid", gap: 16 }}>
                            <button
                                onClick={retakeVideo}
                                disabled={isUploading}
                                style={{
                                    height: 48,
                                    borderRadius: 999,
                                    border: "1px solid green",
                                    background: "#fff",
                                    color: "green",
                                    fontWeight: 600,
                                    cursor: isUploading ? "not-allowed" : "pointer",
                                    opacity: isUploading ? 0.7 : 1,
                                }}
                            >
                                Retake video
                            </button>

                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                style={{
                                    height: 48,
                                    borderRadius: 999,
                                    border: "none",
                                    background: isUploading ? "#7fb38a" : "green",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: isUploading ? "not-allowed" : "pointer",
                                    opacity: isUploading ? 0.85 : 1,
                                }}
                            >
                                {isUploading
                                    ? `Uploading ${Math.round(uploadProgress)}%`
                                    : uploadStateText}
                            </button>

                            {uploadedVideoUrl && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#555",
                                        wordBreak: "break-all",
                                        textAlign: "center",
                                    }}
                                >
                                    Uploaded successfully
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const iconButtonStyle = {
    width: 44,
    height: 44,
    borderRadius: "999px",
    border: "1px solid #d8d8d8",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
};