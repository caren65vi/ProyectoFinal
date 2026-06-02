import { auth, db } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { RegularUser } from "../objects/regularUser";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

// Trae datos del usuario desde Firestore
const fetchUserData = async (uid) => {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? snap.data() : null;
};

// Login con email y contraseña — trae datos de Firestore
export const signIn = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  const userData = await fetchUserData(res.user.uid);
  return { user: res.user, userData };
};

// Login con Google — si es usuario nuevo lo registra en Firestore
export const signInGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  let userData = await fetchUserData(res.user.uid);
  if (!userData) {
    const nuevoUsuario = new RegularUser({
      uid: res.user.uid,
      email: res.user.email,
      nombre: res.user.displayName || res.user.email,
    });
    await nuevoUsuario.guardar();
    userData = nuevoUsuario.mostrar();
  }
  return { user: res.user, userData };
};

// Login con GitHub — si es usuario nuevo lo registra en Firestore
// Login con Microsoft - si es usuario nuevo lo registra en Firestore
export const signInMicrosoft = async () => {
  const res = await signInWithPopup(auth, microsoftProvider);
  let userData = await fetchUserData(res.user.uid);
  if (!userData) {
    const nuevoUsuario = new RegularUser({
      uid: res.user.uid,
      email: res.user.email,
      nombre: res.user.displayName || res.user.email,
    });
    await nuevoUsuario.guardar();
    userData = nuevoUsuario.mostrar();
  }
  return { user: res.user, userData };
};

export const signInGithub = async () => {
  const res = await signInWithPopup(auth, githubProvider);
  let userData = await fetchUserData(res.user.uid);
  if (!userData) {
    const nuevoUsuario = new RegularUser({
      uid: res.user.uid,
      email: res.user.email,
      nombre: res.user.displayName || res.user.email,
    });
    await nuevoUsuario.guardar();
    userData = nuevoUsuario.mostrar();
  }
  return { user: res.user, userData };
};

// Registro con email — crea en Auth y hace push a Firestore con RegularUser
export const register = async (email, password, nombre) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  const nuevoUsuario = new RegularUser({ uid: res.user.uid, email, nombre });
  await nuevoUsuario.guardar();
  return { user: res.user, userData: nuevoUsuario.mostrar() };
};

export const doSignOut = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
