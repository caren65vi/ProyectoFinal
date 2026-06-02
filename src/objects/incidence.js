import { doc, setDoc } from 'firebase/firestore'
import { db } from '../FireBase/config'

function generateId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {

  }
  return `inc_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}


export function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let w = img.width
      let h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else        { w = Math.round((w * MAX) / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = reject
    img.src = url
  })
}

export const allowedTypes = ['electrico', 'infraestructura', 'plomeria', 'seguridad', 'otro']
export const allowedStates = ['abierto', 'en_proceso', 'cerrado']

export function validateIncidence(payload = {}) {
  const errors = []

  if (!payload.tipo) errors.push('El tipo de incidente es obligatorio.')
  else if (!allowedTypes.includes(payload.tipo)) errors.push('El tipo de incidente no es valido.')

  if (!payload.foto) errors.push('La fotografia es obligatoria.')
  if (!payload.descripcion) errors.push('La descripcion es obligatoria.')
  if (!payload.idUsuario) errors.push('Debes iniciar sesion para enviar un reporte.')

  if (payload.latitud != null && typeof payload.latitud !== 'number') errors.push('La latitud debe ser un numero.')
  if (payload.longitud != null && typeof payload.longitud !== 'number') errors.push('La longitud debe ser un numero.')
  if (payload.estado && !allowedStates.includes(payload.estado)) errors.push('El estado no es valido.')

  return { valid: errors.length === 0, errors }
}

export class Incidence {
  constructor(data = {}) {
    this.id = data.id || generateId()
    this.tipo = data.tipo || null
    this.foto = data.foto || null
    this.fecha = data.fecha || new Date().toISOString()
    this.descripcion = data.descripcion || null
    this.ubicacionTextual = data.ubicacionTextual || null
    this.latitud = data.latitud != null ? Number(data.latitud) : null
    this.longitud = data.longitud != null ? Number(data.longitud) : null
    this.estado = data.estado || 'abierto'
    this.idUsuario = data.idUsuario || null
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || null
  }

  mostrar() {
    return {
      id: this.id,
      tipo: this.tipo,
      foto: this.foto,
      fecha: this.fecha,
      descripcion: this.descripcion,
      ubicacionTextual: this.ubicacionTextual,
      latitud: this.latitud,
      longitud: this.longitud,
      estado: this.estado,
      idUsuario: this.idUsuario,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  async guardar(photoFile) {
    if (!photoFile && !this.foto) throw new Error('La fotografia es obligatoria.')
    if (!this.idUsuario) throw new Error('Debes iniciar sesion para enviar un reporte.')

    if (photoFile) {
      try {
        this.foto = await comprimirImagen(photoFile)
      } catch (imgError) {
        throw new Error('No se pudo procesar la imagen. Intenta con otra foto.')
      }
    }

    const data = this.mostrar()
    const { valid, errors } = validateIncidence(data)
    if (!valid) {
      const error = new Error(errors.join(' '))
      error.details = errors
      throw error
    }

    try {
      await setDoc(doc(db, 'incidente', this.id), data)
    } catch (firestoreError) {
      console.error('[Incidence] Error Firestore:', firestoreError)
      const code = firestoreError?.code ?? ''
      if (code === 'permission-denied') throw new Error('Sin permiso para guardar. Revisa las reglas de Firestore.')
      throw new Error(`Error al guardar (${code || firestoreError.message}).`)
    }

    return data
  }
}

export function createIncidence(data = {}) {
  return new Incidence(data)
}
