import React, { useState } from 'react'
import './Geolocalizacion.css'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CloseIcon from '@mui/icons-material/Close'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

const Geolocalizacion = ({ onClose, onConfirm }) => {
    const [coords, setCoords] = useState(null)
    const [estado, setEstado] = useState('idle')
    const [mensaje, setMensaje] = useState('')

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) {
            setEstado('error')
            setMensaje('Tu navegador no soporta geolocalización.')
            return
        }
        setEstado('cargando')
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setCoords({ lat: latitude, lng: longitude })
                setEstado('ok')
            },
            () => {
                setEstado('error')
                setMensaje('No se pudo obtener la ubicación. Verifica los permisos.')
            }
        )
    }

    const abrirEnMaps = () => {
        if (!coords) return
        window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')
    }

    return (
        <div className="geo-modal-overlay" onClick={onClose}>
            <div className="geo-modal" onClick={(e) => e.stopPropagation()}>

                <div className="geo-modal__header">
                    <h2>Geolocalización</h2>
                    <button className="geo-modal__close" onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </button>
                </div>

                {/* Mapa o estado */}
                <div className="geo-modal__status">
                    {estado === 'idle' && (
                        <>
                            <LocationOnIcon style={{ fontSize: 36, opacity: 0.4 }} />
                            <span>Presiona el botón para obtener tu ubicación</span>
                        </>
                    )}
                    {estado === 'cargando' && (
                        <>
                            <MyLocationIcon style={{ fontSize: 36, opacity: 0.6 }} />
                            <span>Obteniendo tu ubicación...</span>
                        </>
                    )}
                    {estado === 'error' && (
                        <span style={{ color: '#f87171' }}>{mensaje}</span>
                    )}
                    {estado === 'ok' && coords && (
                        <iframe
                            title="mapa"
                            width="100%"
                            height="100%"
                            style={{ border: 'none', borderRadius: 10 }}
                            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`}
                        />
                    )}
                </div>

                <div className="geo-modal__actions">
                    <button onClick={obtenerUbicacion}>
                        <MyLocationIcon fontSize="small" />
                        {estado === 'cargando' ? 'Buscando...' : 'Obtener ubicación'}
                    </button>
                    <button
                        className="geo-modal__btn-maps"
                        disabled={!coords}
                        onClick={abrirEnMaps}
                    >
                        <OpenInNewIcon fontSize="small" />
                        Abrir en Maps
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Geolocalizacion
