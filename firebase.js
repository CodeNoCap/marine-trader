import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js" ;
import { getFirestore, doc, setDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdkTTiJ1aU01BRtTJNSBTLgILGlrrjp_c",
  authDomain: "marine-trader-6aeaf.firebaseapp.com",
  projectId: "marine-trader-6aeaf",
  storageBucket: "marine-trader-6aeaf.appspot.com",
  messagingSenderId: "710444092896",
  appId: "1:710444092896:web:764efd3519d99960eb6f85",
  measurementId: "G-H5HWNEW6SD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);