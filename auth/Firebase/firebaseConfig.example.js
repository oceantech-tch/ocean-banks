import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

  const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  export {app}