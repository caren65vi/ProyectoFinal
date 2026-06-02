import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../FireBase/config";

export class RegularUser {
  constructor({ uid, email, nombre, descripcion, permisos, creadoEn }) {
    this.uid = uid;
    this.email = email;
    this.nombre = nombre;
    this.rol = "usuario";
    this.descripcion = descripcion ?? "Reporta incidentes";
    this.permisos = permisos ?? ["leer", "reportar_incidentes"];
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

  async guardar() {
    await setDoc(doc(db, "usuarios", this.uid), this.mostrar());
  }

  async actualizar(cambios) {
    await updateDoc(doc(db, "usuarios", this.uid), cambios);
    Object.assign(this, cambios);
  }

  async eliminar() {
    await deleteDoc(doc(db, "usuarios", this.uid));
  }
}
