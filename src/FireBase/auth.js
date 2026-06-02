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

const googleProvider   = new GoogleAuthProvider();
const githubProvider   = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

// ── Busca usuario en Firestore por su UID (clave del documento) ──
const fetchUserData = async (uid) => {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? snap.data() : null;
};

// ── Busca usuario por email o correo (para documentos creados manualmente) ──
const fetchUserDataByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  // Campo "email" — usuarios creados desde la app
  const snap1 = await getDocs(
    query(collection(db, "usuarios"), where("email", "==", normalizedEmail), limit(1)),
  );
  if (!snap1.empty) return snap1.docs[0].data();

  // Campo "correo" — documentos creados manualmente en Firestore
  const snap2 = await getDocs(
    query(collection(db, "usuarios"), where("correo", "==", normalizedEmail), limit(1)),
  );
  return snap2.empty ? null : snap2.docs[0].data();
};

export const fetchUserDataForAuth = async (firebaseUser) => {
  if (!firebaseUser?.uid) return null;

  const byUid = await fetchUserData(firebaseUser.uid);
  if (byUid) return byUid;

  return fetchUserDataByEmail(firebaseUser.email);
};

// ── Devuelve el rol del usuario (guardia de rutas) ──
// Busca el documento del usuario con los datos de autenticación disponibles.
export const fetchRolByUid = async (firebaseUser) => {
  if (!firebaseUser?.uid) return null;
  const userData = await fetchUserDataForAuth(firebaseUser);
  return userData?.rol ?? null;
};

// ── Crea documento en Firestore si el usuario social no existe ──
const createSocialUserIfMissing = async (firebaseUser) => {
  // 1. Busca por UID (caso normal)
  const existingUser = await fetchUserDataForAuth(firebaseUser);
  if (existingUser) return existingUser;

  // 2. Busca por email/correo (documento creado manualmente con UID diferente)
  // 3. Usuario completamente nuevo — lo registra como usuario regular
  const newUser = new RegularUser({
    uid: firebaseUser.uid,
    email: normalizeEmail(firebaseUser.email),
    nombre: firebaseUser.displayName || firebaseUser.email,
  });
  await newUser.guardar();
  return newUser.mostrar();
};

// ── Login con email y contraseña ──
export const signIn = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);

  // Busca por UID primero; si el doc fue creado manualmente, busca por email
  const userData = await fetchUserDataForAuth(res.user);
  return { user: res.user, userData };
};

// ── Login con Google ──
export const signInGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

// ── Login con Microsoft ──
export const signInMicrosoft = async () => {
  const res = await signInWithPopup(auth, microsoftProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

// ── Login con GitHub ──
export const signInGithub = async () => {
  const res = await signInWithPopup(auth, githubProvider);
  const userData = await createSocialUserIfMissing(res.user);
  return { user: res.user, userData };
};

// ── Registro con email/contraseña ──
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

export const doSignOut  = async () => { await signOut(auth); };
export const resetPassword = async (email) => { await sendPasswordResetEmail(auth, email); };
export const onAuthChange  = (callback) => onAuthStateChanged(auth, callback);
