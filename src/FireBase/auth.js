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
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { RegularUser } from "../objects/regularUser";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

// Trae datos del usuario desde Firestore
const fetchUserData = async (uid) => {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? snap.data() : null;
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const fetchUserDataByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const snap = await getDocs(
    query(collection(db, "usuarios"), where("email", "==", normalizedEmail), limit(1)),
  );
  return snap.empty ? null : snap.docs[0].data();
};

const createSocialUserIfMissing = async (firebaseUser) => {
  const userData = await fetchUserData(firebaseUser.uid);
  if (userData) return userData;

  const existingUser = await fetchUserDataByEmail(firebaseUser.email);
  if (existingUser) {
    await signOut(auth);
    const error = new Error("Ya existe una cuenta con ese correo. Inicia sesion con el metodo usado al registrarte.");
    error.code = "auth/email-already-in-use";
    throw error;
  }

  const newUser = new RegularUser({
    uid: firebaseUser.uid,
    email: normalizeEmail(firebaseUser.email),
    nombre: firebaseUser.displayName || firebaseUser.email,
  });
  await newUser.guardar();
  return newUser.mostrar();
};

// Login con email y contraseña — trae datos de Firestore
export const signIn = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  const userData = await fetchUserData(res.user.uid);
  return { user: res.user, userData };
};

// Login con Google — si es usuario nuevo lo registra en Firestore
export const signInGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

// Login con GitHub — si es usuario nuevo lo registra en Firestore
// Login con Microsoft - si es usuario nuevo lo registra en Firestore
export const signInMicrosoft = async () => {
  const res = await signInWithPopup(auth, microsoftProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

export const signInGithub = async () => {
  const res = await signInWithPopup(auth, githubProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

// Registro con email — crea en Auth y hace push a Firestore con RegularUser
export const register = async (email, password, nombre) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await fetchUserDataByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error("Ya existe una cuenta con ese correo.");
    error.code = "auth/email-already-in-use";
    throw error;
  }

  const res = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const newUser = new RegularUser({ uid: res.user.uid, email: normalizedEmail, nombre });
  await newUser.guardar();
  return { user: res.user, userData: newUser.mostrar() };
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
