// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: API_KEY "AIzaSyDGSW4Ri2NJ2yA-4N6Vv1iWVWJb2e1UT4c",
  authDomain: AUTH_DOMAIN"zk-bluff-94cd6.firebaseapp.com",
  projectId: PROJECT_ID"zk-bluff-94cd6",
  storageBucket: STORAGE_BUCKET"zk-bluff-94cd6.firebasestorage.app",
  messagingSenderId: MESSAGING_SENDER_ID"896750423528",
  appId: APP_ID"1:896750423528:web:5f60e3350e408ed4d3a85d",
  measurementId: MEASUREMENT_ID"G-S607K729MB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);