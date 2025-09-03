// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-VhQ-5H5HZCLmR3DxBasuV0UKmoPnWMU",
  authDomain: "futbolo-pro.firebaseapp.com",
  projectId: "futbolo-pro",
  storageBucket: "futbolo-pro.firebasestorage.app",
  messagingSenderId: "870720922540",
  appId: "1:870720922540:web:0d4bd6cbbb85a534469009"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
