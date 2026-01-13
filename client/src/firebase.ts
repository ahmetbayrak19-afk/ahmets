import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCg_YiwjX-Ys2JCy38x17BMBlDBDZVGniU",
  authDomain: "ogrencitakip-2a775.firebaseapp.com",
  projectId: "ogrencitakip-2a775",
  storageBucket: "ogrencitakip-2a775.firebasestorage.app",
  messagingSenderId: "838766806928",
  appId: "1:838766806928:web:fb4d4ec4b20a52f54e5515"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
