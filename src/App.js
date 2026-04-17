import React from 'react';
import VideoCallPage from "./pages/VideoCallPage";
import VideoRecordingPage from "./pages/VideoRecordingPage";
import IntroduceYourselfPage from "./pages/IntroduceYourselfPage";
import DocusignPage from "./pages/DocuSignPage";


// Optional reusable error component
const Error = ({ message }) => (
  <div style={{ color: "black", padding: 20 }}>
    ❌ {message}
  </div>
);

function App() {
  const params = new URLSearchParams(window.location.search);

  const room = params.get("room");
  const token = params.get("token");
  const userName = params.get("userName");
  const pageType = params.get("pageType");
  const signingUrl = params.get("signingUrl");
  const videoUrl = params.get("videoUrl");
  const photoUrl = params.get("photoUrl");
  const roomUrl = room
    ? `https://skpnation.daily.co/${room}`
    : null;

  // 👇 Decide what to render
  let content;

  switch (pageType) {
    case "video-call":
      content = roomUrl ? (
        <VideoCallPage
          roomUrl={roomUrl}
          token={token}
          userName={userName}
        />
      ) : (
        <Error message="No room provided" />
      );
      break;

    case "video-recording":
      content = (
        <IntroduceYourselfPage
          userName={userName}
        />
      );
      break;

    case "record-video":
      content = (
        <VideoRecordingPage userName={userName} />
      );
      break;

    case "docusign":
      content = (
        <DocusignPage
          signingUrl={signingUrl}
          videoUrl={videoUrl}
          photoUrl={photoUrl}
          onSigningComplete={() => {
            console.log("Signing complete");
          }}
        />
      );
      break;

    default:
      content = <Error message="Invalid pageType" />;
  }

  // 👇 Return the chosen content
  return <>{content}</>;
}

export default App;