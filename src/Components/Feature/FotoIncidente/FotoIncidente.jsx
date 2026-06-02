import { useRef, useState } from 'react'
import './FotoIncidente.css'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'

const FotoIncidente = ({ onClose, onConfirm }) => {
    const [preview, setPreview] = useState(null)
    const galeriaRef = useRef()
    const camaraRef = useRef()

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setPreview(url)
    }

    const handleConfirm = () => {
        onConfirm?.(preview)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>

                <div className="modal__header">
                    <h2>Foto del incidente</h2>
                    <button className="modal__close" onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </button>
                </div>

                {/* Zona de previsualización */}
                <div className="modal__preview" onClick={() => galeriaRef.current.click()}>
                    {preview
                        ? <img src={preview} alt="Vista previa" />
                        : <>
                            <CameraAltIcon style={{ fontSize: 36, opacity: 0.4 }} />
                            <span>Toca para seleccionar una foto</span>
                          </>
                    }
                </div>

                {/* Inputs ocultos */}
                <input
                    ref={galeriaRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                />
                <input
                    ref={camaraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                />

                {/* Botones */}
                <div className="modal__actions">
                    <button onClick={() => galeriaRef.current.click()}>
                        <PhotoLibraryIcon fontSize="small" />
                        Galería
                    </button>
                    <button onClick={() => camaraRef.current.click()}>
                        <CameraAltIcon fontSize="small" />
                        Cámara
                    </button>
                    <button
                        className="modal__btn-confirm"
                        disabled={!preview}
                        onClick={handleConfirm}
                    >
                        <CheckIcon fontSize="small" />
                        Listo
                    </button>
                </div>

            </div>
        </div>
    )
}

export default FotoIncidente
