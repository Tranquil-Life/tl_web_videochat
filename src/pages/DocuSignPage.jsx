import React, { useEffect, useRef, useState } from "react";

export default function DocusignPage({
  signingUrl,
  videoUrl,
  photoUrl,
  userName,
  onSigningComplete,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasPostedRef = useRef(false);

  useEffect(() => {
    console.log("DocusignPage props:", {
      signingUrl,
      videoUrl,
      photoUrl,
      userName,
    });

    const handleMessage = (event) => {
      if (event.data === "SIGNING_COMPLETE") {
        if (hasPostedRef.current) return;
        hasPostedRef.current = true;

        console.log("Message received:", event.data);

        if (typeof onSigningComplete === "function") {
          onSigningComplete();
        }

        const payload = {
          videoUrl: videoUrl || "",
          photoUrl: photoUrl || "",
        };

        setTimeout(() => {
          console.log("Posting to Flutter parent:", payload);
          window.parent.postMessage(payload, "*");
        }, 5000);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onSigningComplete, signingUrl, videoUrl, photoUrl, userName]);

  const handleIframeLoad = () => {
    console.log("Iframe successfully loaded");
    setIsLoading(false);

    const iframe = document.getElementById("docusign-iframe");

    if (!iframe || hasPostedRef.current) return;

    try {
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframeWindow?.document;
      const screenMessage = iframeDocument?.body?.innerText || "";

      console.log("Screen message:", screenMessage);

      if (screenMessage.includes("Thanks! Your account will be created shortly.")) {
        hasPostedRef.current = true;

        if (typeof onSigningComplete === "function") {
          onSigningComplete();
        }



        setTimeout(() => {
          window.parent.postMessage(
            {
              videoUrl: videoUrl || "",
              photoUrl: photoUrl || "",
            },
            "*"
          );
        }, 2000);

      }
    } catch (error) {
      console.log("On DocuSign domain or cross-origin page; cannot inspect iframe yet.");
    }
  };

  if (!signingUrl) {
    return <div style={{ padding: 24, color: "#222" }}>Error loading document</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 600,
          background: "#fff",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        Sign Document
      </div>

      {isLoading && !hasError && (
        <div style={{ padding: 16, textAlign: "center" }}>
          Loading document...
        </div>
      )}

      {hasError ? (
        <div style={{ padding: 24, textAlign: "center" }}>
          Error loading document
        </div>
      ) : (
        <iframe
          id="docusign-iframe"
          src={signingUrl}
          title="DocuSign"
          onLoad={handleIframeLoad}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            background: "#fff",
          }}
        />
      )}
    </div>
  );
}