import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../FireBase/config";

export class AdminUser {
  constructor({ uid, email, nombre, descripcion, permisos, creadoEn }) {
    this.uid = uid;
    this.email = email;
    this.nombre = nombre;
    this.rol = "admin";
    this.descripcion = descripcion ?? "Administrador del sistema";
    this.permisos = permisos ?? ["leer", "escribir", "eliminar", "gestionar_usuarios"];
    this.creadoEn = creadoEn ?? new Date().toISOString();
  }

  mostrar() {
    return {
      uid: this.uid,
      email: this.email,
      nombre: this.nombre,
      rol: this.rol,
      descripcion: this.descripcion,
      permisos: this.permisos,
      creadoEn: this.creadoEn,
    };
  }

  // Push a Firestore con todos sus atributos
  async guardar() {
    await setDoc(doc(db, "usuarios", this.uid), this.mostrar());
  }

  // Actualiza campos específicos en Firestore
  async actualizar(cambios) {
    await updateDoc(doc(db, "usuarios", this.uid), cambios);
    Object.assign(this, cambios);
  }

  // Elimina el documento de Firestore
  async eliminar() {
    await deleteDoc(doc(db, "usuarios", this.uid));
  }
}
