import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
import Call from "./components/Call";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function App() {
  const query = new URLSearchParams(window.location.search);

  const config = {
    appId: query.get("appId"),
    channelName: query.get("channel"),
    token: query.get("token") || null, // null is okay for testing
    uid: query.get("uid") || null,     // Agora will generate one if null
  };

  // 2. Check if the required data exists
  const hasRequiredParams = config.appId && config.channelName;

  // state = {
  //   inCall: false,
  //   channelName: ""
  // };

  // // This function is passed to ChannelForm
  // handleJoin = (name) => {
  //   this.setState({
  //     channelName: name,
  //     inCall: true
  //   });
  // };

  return (
    <div className="App">
      {!hasRequiredParams ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h2>Invalid Meeting Link</h2>
          <p>Please ensure the URL contains <b>appId</b> and <b>channel</b>.</p>
          <pre>?appId=YOUR_ID&channel=test</pre>
        </div>
      ) : (
        <AgoraRTCProvider client={client}>
          <Call 
            appId={config.appId} 
            channelName={config.channelName} 
            token={config.token}
            uid={config.uid}
          />
        </AgoraRTCProvider>
      )}
    </div>
  );
}

export default App;