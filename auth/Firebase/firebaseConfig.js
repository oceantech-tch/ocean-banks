import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  const firebaseConfig = {
    apiKey: "AIzaSyC4Fbxbp-e7NokqNTBECAaI6Pt1bNl6b8U",
    authDomain: "ocean-banks.firebaseapp.com",
    projectId: "ocean-banks",
    storageBucket: "ocean-banks.firebasestorage.app",
    messagingSenderId: "15481220762",
    appId: "1:15481220762:web:a4c27391bc80292eb43923"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  export {app}