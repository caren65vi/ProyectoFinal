import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import Button from '../../Components/Button/Button'
import BrowserHome from '../../Components/BrowserHome/BrowserHome'
import Main from '../../Components/Main/Main'
import Feature from '../../Components/Feature/Feature'
import Pasos from '../../Components/Pasos/Pasos'
import Cta from '../../Components/Cta/Cta'
import Footer from '../../Components/Footer/Footer'
import { createIncidence, comprimirImagen } from '../../objects/incidence'
import '../Reportar/Reportar.css'
import './ReportarAnonimo.css'

const incidentTypes = [
  { value: 'electrico',       label: 'Electrico' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'plomeria',        label: 'Plomeria' },
  { value: 'seguridad',       label: 'Seguridad' },
  { value: 'otro',            label: 'Otro' },
]

const ReportarAnonimo = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ tipo: 'electrico', descripcion: '', ubicacionTextual: '' })
  const [photoBase64, setPhotoBase64]   = useState(null)
  const photoBase64Ref                   = useRef(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoName, setPhotoName]       = useState('')
  const [coordinates, setCoordinates]   = useState({ latitud: null, longitud: null })
  const [locationStatus, setLocationStatus] = useState('Presiona el botón para obtener tu ubicación')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [cameraOpen, setCameraOpen]     = useState(false)
  const [cameraError, setCameraError]   = useState('')
  const [error, setError]               = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving]         = useState(false)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const galleryInputRef = useRef(null)
  const videoRef        = useRef(null)

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('GPS no disponible.'); return }
    setIsGettingLocation(true)
    setLocationStatus('Obteniendo ubicación...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitud: Number(coords.latitude), longitud: Number(coords.longitude) })
        setLocationStatus('Ubicación guardada')
        setIsGettingLocation(false)
      },
      () => { setLocationStatus('No se pudo obtener ubicación.'); setIsGettingLocation(false) },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  useEffect(() => {
    let stream = null
    const open = async () => {
      if (!cameraOpen) return
      if (!navigator.mediaDevices?.getUserMedia) { setCameraError('Cámara no disponible.'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch { setCameraError('No se pudo acceder a la cámara.') }
    }
    open()
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [cameraOpen])

  const handleChange = ({ target: { name, value } }) =>
    setFormData(p => ({ ...p, [name]: value }))

  const applyPhoto = async (file, errMsg) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoName(file.name)
    setError('')
    setIsProcessingPhoto(true)
    try {
      const b64 = await comprimirImagen(file)
      photoBase64Ref.current = b64
      setPhotoBase64(b64)
    } catch { setError(errMsg) }
    finally { setIsProcessingPhoto(false) }
  }

  const handlePhoto = ({ target: { files } }) => {
    if (files?.[0]) applyPhoto(files[0], 'No se pudo procesar la imagen.')
  }

  const closeCamera = () => {
    setCameraOpen(false); setCameraError('')
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
  }

  const captureFromCamera = () => {
    const video = videoRef.current; if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async blob => {
      if (!blob) { setCameraError('No se pudo capturar.'); return }
      closeCamera()
      await applyPhoto(new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' }), 'Error al procesar la foto.')
    }, 'image/jpeg', 0.85)
  }

  const saveReport = async () => {
    setError('')
    setIsSaving(true)
    try {
      const base64 = photoBase64Ref.current || photoBase64
      if (!base64) throw new Error('La fotografía es obligatoria.')

      const incidence = createIncidence({
        ...formData,
        ...coordinates,
        idUsuario: 'anonimo',
        foto: base64,
      })
      await incidence.guardar(null)
      setSuccessMessage('¡Reporte enviado! Gracias por tu colaboración.')
      setTimeout(() => navigate('/'), 2500)
    } catch (e) {
      setError(e.message || 'No fue posible enviar el reporte.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="reportarAnonimoPage">
      <div className="reportarAnonimoHome" aria-hidden="true">
        <BrowserHome />
        <Main />
        <Feature />
        <Pasos />
        <Cta />
        <Footer />
      </div>
      <div className="reportarAnonimoBackdrop" onClick={() => navigate('/')} />

      <section className="reportarModal reportarAnonimoModal" role="dialog" aria-modal="true">
        <header className="reportarHeader">
          <div>
            <span className="reportarAnonimoBadge">Reporte anónimo</span>
            <h1 className="reportarTitle">Reportar incidente</h1>
          </div>
          <button className="reportarClose" type="button" onClick={() => navigate('/')}>
            <CloseIcon />
          </button>
        </header>

        <form className="reportarForm" onSubmit={e => { e.preventDefault(); saveReport() }}>
          <label className="reportarField">
            <span>Tipo de incidente</span>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
              {incidentTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="reportarField">
            <span>Descripcion detallada</span>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}
              placeholder="Describe el incidente con detalle..." rows="4" required />
          </label>

          <label className="reportarField">
            <span>Ubicacion</span>
            <input name="ubicacionTextual" value={formData.ubicacionTextual} onChange={handleChange}
              placeholder="Ej: Bloque B, Aula 203" />
          </label>

          <div className="reportarField">
            <span>Fotografia <b>*</b></span>
            <div className="reportarPhotoActions">
              <button type="button" className="reportarPhotoButton" onClick={() => setCameraOpen(true)}>
                <PhotoCameraOutlinedIcon /><span>Camara</span>
              </button>
              <button type="button" className="reportarPhotoButton reportarPhotoButton--secondary" onClick={() => galleryInputRef.current?.click()}>
                <PhotoLibraryOutlinedIcon /><span>Galeria</span>
              </button>
            </div>
            <div className={`reportarPhoto${photoName ? ' reportarPhotoSelected' : ''}`}>
              {photoPreview
                ? <img src={photoPreview} alt="Foto seleccionada" />
                : <strong>{isProcessingPhoto ? 'Procesando imagen...' : (photoName || 'Selecciona una imagen desde la camara o galeria')}</strong>
              }
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
          </div>

          {cameraOpen && (
            <div className="cameraModalOverlay" onClick={closeCamera}>
              <div className="cameraModal" onClick={e => e.stopPropagation()}>
                <h2>Tomar foto</h2>
                {cameraError && <p className="cameraError">{cameraError}</p>}
                <video ref={videoRef} autoPlay muted playsInline className="cameraPreview" />
                <div className="cameraActions">
                  <button type="button" className="cameraCaptureButton" onClick={captureFromCamera}>Tomar foto</button>
                  <button type="button" className="cameraCancelButton" onClick={closeCamera}>Cancelar</button>
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
              </div>
            </div>
            <div className="reportarLocationActions">
              <button type="button" className="reportarLocationBtn" onClick={requestLocation} disabled={isGettingLocation}>
                {isGettingLocation ? 'Obteniendo...' : 'Obtener ubicación'}
              </button>
            </div>
            {coordinates.latitud != null && (
              <iframe className="reportarMapEmbed" title="Mapa"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitud - 0.003},${coordinates.latitud - 0.003},${coordinates.longitud + 0.003},${coordinates.latitud + 0.003}&layer=mapnik&marker=${coordinates.latitud},${coordinates.longitud}`}
              />
            )}
          </div>

          {successMessage && <p className="reportarSuccess" role="status">{successMessage}</p>}
          {error && <p className="reportarError" role="alert">{error}</p>}

          <footer className="reportarActions">
            <Button className="btnOutline reportarCancel" type="button" onClick={() => navigate('/')}>Cancelar</Button>
            <Button className="reportarSave" type="submit" disabled={isSaving || isProcessingPhoto}>
              {isSaving ? 'Enviando...' : 'Enviar reporte'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ReportarAnonimo
