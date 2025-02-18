import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAW3pl1n1wzImaxKi_4kvzYG2XV6PcQVYo",
  authDomain: "midwestimages-8b254.firebaseapp.com",
  projectId: "midwestimages-8b254",
  storageBucket: "midwestimages-8b254.firebasestorage.app",
  messagingSenderId: "447326949944",
  appId: "1:447326949944:web:6a3bc2d4effaadae464ccd",
  measurementId: "G-H9V3VZ2PSR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// IMPORTANT: You need to update your Firebase Storage Rules in the Firebase Console to:
//
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /customers/{customerId}/{fileName} {
//       allow read, write: if true;
//     }
//   }
// }