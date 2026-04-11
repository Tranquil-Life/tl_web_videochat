import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDvEsztETqHYAwfJx0ocpjPTZccMNDMc-k",
  authDomain: "tranquil-life-llc.firebaseapp.com",
  projectId: "tranquil-life-llc",
  storageBucket: "tranquil-life-llc.appspot.com",
  messagingSenderId: "16125004014",
  appId: "1:16125004014:web:1a1ccb278c740a6d5f8bff",
};

export const app = initializeApp(firebaseConfig);