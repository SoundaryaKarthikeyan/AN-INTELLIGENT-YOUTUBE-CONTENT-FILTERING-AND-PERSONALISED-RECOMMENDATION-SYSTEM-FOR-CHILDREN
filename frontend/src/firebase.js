// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyCYmYSSNsqJPW_rvxxpgi1__CQa2ZRVaxQ",
  authDomain: "kidsapp-425de.firebaseapp.com",
  projectId: "kidsapp-425de",
  storageBucket: "kidsapp-425de.firebasestorage.app",
  messagingSenderId: "1015459905720",
  appId: "1:1015459905720:web:7916f078055f667e28f44d",
  measurementId: "G-76Z0SGMMLD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);