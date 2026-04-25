// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYmYSSNsqJPW_rvxxpgi1__CQa2ZRVaxQ",
  authDomain: "kidsapp-425de.firebaseapp.com",
  projectId: "kidsapp-425de",
  storageBucket: "kidsapp-425de.firebasestorage.app",
  messagingSenderId: "1015459905720",
  appId: "1:1015459905720:web:7916f078055f667e28f44d",
  measurementId: "G-76Z0SGMMLD"
};


// ✅ Prevent re-initialization error
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);