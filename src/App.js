import React from 'react';
// import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
// import Call from "./components/Call";
import VideoCallPage from "./pages/VideoCallPage";

// const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function App() {
  return (
    <VideoCallPage roomUrl="https://skpnation.daily.co/c6uDfgcc8EgDsahJV6dt" />
  );
  // const query = new URLSearchParams(window.location.search);

  // // State for config
  // const [config, setConfig] = useState({
  //   appId: query.get("appId") || "",
  //   channelName: query.get("channel") || "",
  //   token: query.get("token") || null,
  //   uid: query.get("uid") || null,
  // });

  // const [inCall, setInCall] = useState(!!(config.appId && config.channelName));

  // const handleStartCall = (e) => {
  //   e.preventDefault();
  //   if (config.appId && config.channelName) {
  //     setInCall(true);
  //   } else {
  //     alert("Please enter both App ID and Channel Name");
  //   }
  // };

  // return (
  //   <div className="App" style={{
  //     minHeight: "100vh",
  //     background: "linear-gradient(135deg, #f5f7fb 0%, #e4e9f2 100%)",
  //     fontFamily: "'Inter', sans-serif"
  //   }}>
  //     {!inCall ? (
  //       <div style={{
  //         display: "flex",
  //         flexDirection: "column",
  //         alignItems: "center",
  //         justifyContent: "center",
  //         height: "100vh",
  //         padding: "20px"
  //       }}>
  //         <div style={{
  //           background: "white",
  //           padding: "40px",
  //           borderRadius: "24px",
  //           boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  //           maxWidth: "450px",
  //           width: "100%",
  //           border: "1px solid rgba(0,0,0,0.05)"
  //         }}>
  //           <div style={{ textAlign: "center", marginBottom: "35px" }}>
  //             <h1 style={{
  //               margin: "0 0 10px",
  //               color: "#1a1a1a",
  //               fontSize: "2rem",
  //               fontWeight: "800",
  //               letterSpacing: "-0.5px"
  //             }}>
  //               Tranquil Video
  //             </h1>
  //             <p style={{ color: "#666", fontSize: "15px", margin: 0 }}>
  //               Secure, high-quality video conferencing
  //             </p>
  //           </div>

  //           <form onSubmit={handleStartCall} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
  //             <div>
  //               <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", fontSize: "14px", color: "#444" }}>
  //                 Agora App ID
  //               </label>
  //               <input
  //                 type="text"
  //                 placeholder="Paste your App ID"
  //                 value={config.appId}
  //                 onChange={(e) => setConfig({ ...config, appId: e.target.value })}
  //                 style={inputStyle}
  //               />
  //             </div>
  //             <div>
  //               <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", fontSize: "14px", color: "#444" }}>
  //                 Channel Name
  //               </label>
  //               <input
  //                 type="text"
  //                 placeholder="e.g. general-meeting"
  //                 value={config.channelName}
  //                 onChange={(e) => setConfig({ ...config, channelName: e.target.value })}
  //                 style={inputStyle}
  //               />
  //             </div>
  //             <button
  //               type="submit"
  //               style={{
  //                 background: "#007bff",
  //                 color: "white",
  //                 border: "none",
  //                 padding: "16px",
  //                 borderRadius: "12px",
  //                 fontWeight: "700",
  //                 fontSize: "16px",
  //                 cursor: "pointer",
  //                 marginTop: "10px",
  //                 transition: "all 0.3s ease",
  //                 boxShadow: "0 4px 12px rgba(0,123,255,0.25)"
  //               }}
  //               onMouseOver={(e) => {
  //                 e.target.style.background = "#0056b3";
  //                 e.target.style.transform = "translateY(-2px)";
  //               }}
  //               onMouseOut={(e) => {
  //                 e.target.style.background = "#007bff";
  //                 e.target.style.transform = "translateY(0)";
  //               }}
  //             >
  //               Join Video Call
  //             </button>
  //           </form>
  //           <div style={{
  //             marginTop: "25px",
  //             paddingTop: "20px",
  //             borderTop: "1px solid #eee",
  //             textAlign: "center"
  //           }}>
  //             <p style={{ fontSize: "13px", color: "#888", lineHeight: "1.6" }}>
  //               Tip: Use URL parameters for quick access<br />
  //               <code style={{ background: "#f8f9fa", padding: "2px 6px", borderRadius: "4px" }}>
  //                 ?appId=...&channel=...
  //               </code>
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     ) : (
  //       <AgoraRTCProvider client={client}>
  //         <div style={{ position: "relative", height: "100vh" }}>
  //           <Call
  //             appId={config.appId}
  //             channelName={config.channelName}
  //             token={config.token}
  //             uid={config.uid}
  //           />
  //         </div>
  //       </AgoraRTCProvider>
  //     )}
  //   </div>
  // );
}

// const inputStyle = {
//   width: "100%",
//   padding: "14px 16px",
//   borderRadius: "12px",
//   border: "2px solid #edf2f7",
//   boxSizing: "border-box",
//   fontSize: "15px",
//   outline: "none",
//   transition: "border-color 0.2s",
//   background: "#f9fafb"
// };

export default App;