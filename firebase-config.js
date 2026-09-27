// Firebase settings for Google sign-in, the database and photo uploads.
//
// Leave these empty and LittleJoy saves everything in this browser only.
// Fill them in (see SETUP.md) and LittleJoy switches on:
//   • "Sign in with Google" (Google handles the password — LittleJoy never sees it)
//   • saving your journey to your account (Firestore)
//   • artwork photo uploads (Storage)
//   • a shared Community feed
//
// These values are safe to have in the browser — Firebase identifies your project
// with them. What protects your data is the security rules in firestore.rules and storage.rules.

// Google sign-in and cloud saving are switched OFF. Projects are saved in the
// browser (and can be backed up from the Profile page). Set this to true to turn
// Firebase back on — the keys below are kept for that.
const FIREBASE_ENABLED = false;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAR63bwpAG9BF4AI5oHNH-lCYIkAkxXMf0",
  authDomain: "joylab-413f2.firebaseapp.com",
  projectId: "joylab-413f2",
  storageBucket: "joylab-413f2.firebasestorage.app",
  messagingSenderId: "527433628817",
  appId: "1:527433628817:web:72ae55892cd08a4f591330",
};
