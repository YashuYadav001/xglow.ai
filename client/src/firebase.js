import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFMhsbxIs85Qc_UifxcNcvmQfGEOPcJjo",
  authDomain: "auros-fc5b8.firebaseapp.com",
  projectId: "auros-fc5b8",
  storageBucket: "auros-fc5b8.firebasestorage.app",
  messagingSenderId: "966257035883",
  appId: "1:966257035883:web:5cd1902f2cea459da2ff2e",
  measurementId: "G-DF723FGPRR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);


