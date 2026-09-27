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
// browser (and can be backed up from the Profile page).
// To turn Firebase back on: set this to true and paste your project's keys below
// (Firebase console → Project settings → Your apps).
const FIREBASE_ENABLED = false;

const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
