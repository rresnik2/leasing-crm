import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5aOtE84ki0M7KYRKJPdr1RBDDpEVzlMI",
  authDomain: "leasing-crm-6a808.firebaseapp.com",
  projectId: "leasing-crm-6a808",
  storageBucket: "leasing-crm-6a808.firebasestorage.app",
  messagingSenderId: "842495330827",
  appId: "1:842495330827:web:4c45978b9eb39df649150e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);