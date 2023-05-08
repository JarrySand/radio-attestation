// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTfNcKu2qi1b2HX_RDt5_doE-jxUXONG8",
  authDomain: "radio-attestation.firebaseapp.com",
  projectId: "radio-attestation",
  storageBucket: "radio-attestation.appspot.com",
  messagingSenderId: "113867670687",
  appId: "1:113867670687:web:c523d216e3cef2982dceaa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
