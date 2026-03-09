// ─────────────────────────────────────────────────────────
// MOMENTUM — Firebase Config
// Preencha: Firebase Console → Project Settings → Your apps
// ─────────────────────────────────────────────────────────
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYwneFYZ7uEn-vKzcCSPQ10oprJ0adGLs",
  authDomain: "momentum-br.firebaseapp.com",
  projectId: "momentum-br",
  storageBucket: "momentum-br.firebasestorage.app",
  messagingSenderId: "942527884359",
  appId: "1:942527884359:web:eb926e57ccfe40c61c5562"
};

const ADMIN_EMAIL = "pedroseparate@gmail.com";

firebase.initializeApp(FIREBASE_CONFIG);
window.db   = firebase.firestore();
window.auth = firebase.auth();

// AUTH
function authSignIn(email,password){return auth.signInWithEmailAndPassword(email,password);}
function authSignOut(){return auth.signOut();}
function onAuthReady(cb){auth.onAuthStateChanged(cb);}
function isAdmin(user){return user&&user.email===ADMIN_EMAIL;}

// GUARDS
function redirectIfNotAuth(p='login.html'){onAuthReady(u=>{if(!u)window.location.href=p;});}
function redirectIfNotAdmin(p='login.html'){onAuthReady(u=>{if(!u||!isAdmin(u))window.location.href=p;});}
function redirectIfLoggedIn(dest='momentum-dashboard-v2.html'){onAuthReady(u=>{if(u)window.location.href=isAdmin(u)?dest:'momentum-cliente-soares.html';});}

// EXERCISES
async function dbGetExercises(){const s=await db.collection('exercises').orderBy('name').get();return s.docs.map(d=>({id:d.id,...d.data()}));}
async function dbSaveExercise(id,data){await db.collection('exercises').doc(id).set(data,{merge:true});}

// STUDENTS
async function dbGetStudents(){const s=await db.collection('students').orderBy('name').get();const o={};s.forEach(d=>{o[d.id]={id:d.id,...d.data()};});return o;}
async function dbGetStudent(id){const d=await db.collection('students').doc(id).get();return d.exists?{id:d.id,...d.data()}:null;}
async function dbSaveStudent(id,data){await db.collection('students').doc(id).set(data,{merge:true});}

// SESSIONS
async function dbGetSessions(studentId){const s=await db.collection('sessions').where('student_id','==',studentId).orderBy('date','desc').get();return s.docs.map(d=>({id:d.id,...d.data()}));}
async function dbSaveSession(data){const r=db.collection('sessions').doc();await r.set({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});return r.id;}

// MESOCICLOS
async function dbGetMesos(studentId){const s=await db.collection('students').doc(studentId).collection('mesociclos').orderBy('createdAt','desc').get();return s.docs.map(d=>({id:d.id,...d.data()}));}
async function dbSaveMeso(studentId,meso){const r=db.collection('students').doc(studentId).collection('mesociclos').doc();await r.set({...meso,createdAt:firebase.firestore.FieldValue.serverTimestamp()});return r.id;}
