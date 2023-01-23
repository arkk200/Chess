import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDgYLFOzFdnXorcsc2ibl90L9U8e_NTb8E",
  authDomain: "chess-6612b.firebaseapp.com",
  databaseURL: "https://chess-6612b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chess-6612b",
  storageBucket: "chess-6612b.appspot.com",
  messagingSenderId: "934484917552",
  appId: "1:934484917552:web:f9a2e8902098cdfda01cf5",
  measurementId: "G-4NRC25GNMK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);