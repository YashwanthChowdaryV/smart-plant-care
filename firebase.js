import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlRAlD6ry3UZh06Zr83iVzkroQqkrzhlw",
  authDomain: "smartplantcare-78386.firebaseapp.com",
  databaseURL: "https://smartplantcare-78386-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartplantcare-78386",
  storageBucket: "smartplantcare-78386.firebasestorage.app",
  messagingSenderId: "698352328260",
  appId: "1:698352328260:web:8fe80cfc210dffdc372611",
  measurementId: "G-RB10MYQ4ZF"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
