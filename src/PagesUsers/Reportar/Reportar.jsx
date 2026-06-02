import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import Button from '../../Components/Button/Button'
import Dashboard from '../Dashboard/Dashboard'
import { auth } from '../../FireBase/config'
import { createIncidence, comprimirImagen } from '../../Objects/incidence'
import './Reportar.css'

const incidentTypes = [
  { value: 'electrico', label: 'Electrico' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'plomeria', label: 'Plomeria' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'otro', label: 'Otro' },
]

const Reportar = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipo: 'electrico',
    descripcion: '',
    ubicacionTextual: '',
  })
  const [photoBase64, setPhotoBase64] = useState(null)
  const photoBase64Ref = useRef(null)
  const photoProcessingRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [coordinates, setCoordinates] = useState({ latitud: null, longitud: null })
  const [locationStatus, setLocationStatus] = useState(
    'Presiona el botón para obtener tu ubicación',
  )
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [photoName, setPhotoName] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const galleryInputRef = useRef(null)
  const videoRef = useRef(null)
  const redirectTimerRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocalización no disponible en este navegador.')
      return
    }

    setIsGettingLocation(true)
    setLocationStatus('Obteniendo ubicación...')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitud: Number(coords.latitude), longitud: Number(coords.longitude) })
        setLocationStatus('Ubicación guardada con éxito')
        setIsGettingLocation(false)
      },
      (err) => {
        console.error('[Reportar] geolocation error', err)
        setLocationStatus('No se pudo obtener la ubicación. Revisa permisos GPS.')
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  const openMaps = () => {
    if (coordinates.latitud == null || coordinates.longitud == null) return
    const url = `https://www.google.com/maps?q=${coordinates.latitud},${coordinates.longitud}`
    window.open(url, '_blank')
  }

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let currentStream = null
    const openCameraDevice = async () => {
      if (!cameraOpen) return
      setCameraError('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Este dispositivo no soporta acceso directo a la cámara.')
        return
      }

      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream
        }
      } catch (err) {
        console.error('[Reportar] getUserMedia error', err)
        setCameraError('No se pudo acceder a la cámara. Autoriza el permiso o usa galería.')
      }
    }

    openCameraDevice()

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraOpen])

  const closeReport = () => navigate('/dashboard')

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const processPhoto = async (file, errorMessage) => {
    photoBase64Ref.current = null
    setPhotoBase64(null)
    setIsProcessingPhoto(true)
    const processing = comprimirImagen(file)
    photoProcessingRef.current = processing

    try {
      const base64 = await processing
      if (photoProcessingRef.current === processing) {
        photoBase64Ref.current = base64
        setPhotoBase64(base64)
      }
    } catch {
      if (photoProcessingRef.current === processing) setError(errorMessage)
    } finally {
      if (photoProcessingRef.current === processing) {
        photoProcessingRef.current = null
        setIsProcessingPhoto(false)
      }
    }
  }

  const handlePhoto = async ({ target: { files } }) => {
    const file = files?.[0]
    if (!file) return

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setPhotoName(file.name)
    setError('')

    await processPhoto(file, 'No se pudo procesar la imagen. Intenta con otra.')
  }

  const openCamera = () => setCameraOpen(true)
  const openGallery = () => galleryInputRef.current?.click()

  const closeCamera = () => {
    setCameraOpen(false)
    setCameraError('')
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject
      if (stream.getTracks) {
        stream.getTracks().forEach((track) => track.stop())
      }
      videoRef.current.srcObject = null
    }
  }

  const captureFromCamera = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCameraError('No se pudo capturar la imagen. Intenta de nuevo.')
        return
      }
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' })
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      const previewUrl = URL.createObjectURL(file)

      setPhotoPreview(previewUrl)
      setPhotoName(file.name)
      setError('')
      closeCamera()

      try {
        const base64 = await comprimirImagen(file)
        photoBase64Ref.current = base64
        setPhotoBase64(base64)
      } catch {
        setError('No se pudo procesar la imagen de la cámara.')
      }
    }, 'image/jpeg', 0.85)
  }

  const saveReport = async () => {
    setError('')
    setIsSaving(true)

    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('Debes iniciar sesion para enviar un reporte.')

      const base64 = photoBase64Ref.current || photoBase64
      if (!base64) throw new Error('La fotografia es obligatoria.')

      const incidence = createIncidence({
        ...formData,
        ...coordinates,
        idUsuario: userId,
        foto: base64,
      })
      await incidence.guardar(null)
      setSuccessMessage('¡Guardado con éxito! Te redirigimos al dashboard...')
      redirectTimerRef.current = window.setTimeout(() => navigate('/dashboard'), 3000)
    } catch (submitError) {
      console.error('[Reportar] Error al guardar reporte:', submitError)
      setError(submitError.message || 'No fue posible enviar el reporte.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await saveReport()
  }

  useEffect(() => {
    if (successMessage) {
      setError('')
    }
  }, [successMessage])

  return (
    <div className="reportar">
      <div className="reportarDashboard" aria-hidden="true">
        <Dashboard />
      </div>
      <div className="reportarBackdrop" onClick={closeReport} />

      <section className="reportarModal" role="dialog" aria-modal="true" aria-labelledby="reportarTitle">
        <header className="reportarHeader">
          <h1 id="reportarTitle" className="reportarTitle">Nuevo reporte de incidente</h1>
          <button className="reportarClose" type="button" onClick={closeReport} aria-label="Cerrar formulario">
            <CloseIcon />
          </button>
        </header>

        <form className="reportarForm" onSubmit={handleSubmit}>
          <label className="reportarField">
            <span>Tipo de incidente</span>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
              {incidentTypes.map(({ value, label }) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>

          <label className="reportarField">
            <span>Descripcion detallada</span>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe el incidente con detalle..."
              rows="4"
              required
            />
          </label>

          <label className="reportarField">
            <span>Ubicacion</span>
            <input
              name="ubicacionTextual"
              value={formData.ubicacionTextual}
              onChange={handleChange}
              placeholder="Ej: Bloque B, Aula 203"
            />
          </label>

          <div className="reportarField">
            <span>Fotografia <b>*</b></span>
            <div className="reportarPhotoActions">
              <button type="button" className="reportarPhotoButton" onClick={openCamera}>
                <PhotoCameraOutlinedIcon />
                <span>Camara</span>
              </button>
              <button type="button" className="reportarPhotoButton reportarPhotoButton--secondary" onClick={openGallery}>
                <PhotoLibraryOutlinedIcon />
                <span>Galeria</span>
              </button>
            </div>
            <div className={`reportarPhoto${photoName ? ' reportarPhotoSelected' : ''}`}>
              {photoPreview
                ? <img src={photoPreview} alt="Foto seleccionada" />
                : <strong>{photoName || 'Selecciona una imagen desde la camara o galeria'}</strong>
              }
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
          </div>
          {cameraOpen && (
            <div className="cameraModalOverlay" onClick={closeCamera}>
              <div className="cameraModal" onClick={(e) => e.stopPropagation()}>
                <h2>Permitir acceso a la cámara</h2>
                {cameraError && <p className="cameraError">{cameraError}</p>}
                <video ref={videoRef} autoPlay muted playsInline className="cameraPreview" />
                <div className="cameraActions">
                  <button type="button" className="cameraCaptureButton" onClick={captureFromCamera}>
                    Tomar foto
                  </button>
                  <button type="button" className="cameraCancelButton" onClick={closeCamera}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="reportarLocationCard">
            <div className="reportarLocationInfo">
              <LocationOnOutlinedIcon />
              <div>
                <span className="reportarLocationLabel">Geolocalización (opcional)</span>
                <strong>{locationStatus}</strong>
                {coordinates.latitud != null && coordinates.longitud != null && (
                  <p className="reportarLocationCoords">
                    Lat: {coordinates.latitud.toFixed(6)} • Lon: {coordinates.longitud.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <div className="reportarLocationActions">
              <button
                type="button"
                className="reportarLocationBtn"
                onClick={requestLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? 'Obteniendo ubicación...' : 'Obtener ubicación'}
              </button>
              <button
                type="button"
                className="reportarLocationBtn reportarLocationBtn--secondary"
                onClick={openMaps}
                disabled={coordinates.latitud == null || coordinates.longitud == null}
              >
                Abrir en Maps
              </button>
            </div>
          </div>

          {successMessage && <p className="reportarSuccess" role="status">{successMessage}</p>}
          {error && <p className="reportarError" role="alert">{error}</p>}

          <footer className="reportarActions">
            <Button className="btnOutline reportarCancel" type="button" onClick={closeReport}>Cancelar</Button>
            <Button className="reportarSave" type="submit" disabled={isSaving}>
              {isSaving ? 'Enviando...' : 'Guardar reporte'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default Reportar
