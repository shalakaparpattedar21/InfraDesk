
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
const firebaseConfig = 
{
  apiKey: "AIzaSyDjkdVUzmKKKvVrdIgKcl5sAIjWit4c2ME",
  authDomain: "campus-infrastructure-tracker.firebaseapp.com",
  projectId: "campus-infrastructure-tracker",
  storageBucket: "campus-infrastructure-tracker.firebasestorage.app",
  messagingSenderId: "113268169460",
  appId: "1:113268169460:web:704d546c91ae1465405ca1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };

