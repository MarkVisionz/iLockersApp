import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider /*, OAuthProvider */ } from "firebase/auth";

// 🔒 Apple login future-ready (requiere cuenta Apple Developer)
// const appleProvider = new OAuthProvider("apple.com");
// appleProvider.addScope("email");
// appleProvider.addScope("name");

const firebaseConfig = {
  apiKey: "AIzaSyBW1Ay9ulSbU7R1svC2x_-nFw0XjtNV7kI",
  authDomain: "easylaundry-bdc8c.firebaseapp.com",
  projectId: "easylaundry-bdc8c",
  storageBucket: "easylaundry-bdc8c.firebasestorage.app",
  messagingSenderId: "16838873957",
  appId: "1:16838873957:web:03d05f5a0e0b4d0190878c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// export { auth, googleProvider, facebookProvider, appleProvider }; // ← Habilita esto cuando tengas Apple Dev
export { auth, googleProvider, facebookProvider };
