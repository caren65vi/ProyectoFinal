import { useEffect, useRef, useState } from 'react'
import './Feature.css'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import NotificationsIcon from '@mui/icons-material/Notifications'
import FotoIncidente from '../Feature/FotoIncidente/FotoIncidente'
import Geolocalizacion from '../Feature/Geolocalizacion/Geolocalizacion'

const features = [
    {
        icon: <CameraAltIcon fontSize="small" />,
        title: 'Foto del incidente',
        desc: 'Adjunta una fotografía desde tu cámara o galería para documentar el problema de forma clara.',
    },
    {
        icon: <LocationOnIcon fontSize="small" />,
        title: 'Geolocalización',
        desc: 'Registra la ubicación exacta del incidente usando GPS o seleccionando manualmente el lugar.',
    },
    {
        icon: <AutorenewIcon fontSize="small" />,
        title: 'Seguimiento en tiempo real',
        desc: 'Consulta el estado de tus reportes: Reportado, En proceso o Resuelto, en cualquier momento.',
    },
    {
        icon: <NotificationsIcon fontSize="small" />,
        title: 'Notificaciones',
        desc: 'Recibe alertas cuando el estado de tu incidente cambie o sea atendido por el equipo responsable.',
    },
]

const handlers = (i, setModalFoto, setModalGeo) => {
    if (i === 0) return () => setModalFoto(true)
    if (i === 1) return () => setModalGeo(true)
    return undefined
}

const Feature = () => {
    const gridRef = useRef(null)
    const [modalFoto, setModalFoto] = useState(false)
    const [modalGeo, setModalGeo] = useState(false)

    useEffect(() => {
        const cards = gridRef.current?.querySelectorAll('.feature-card')
        if (!cards?.length) return undefined
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return
                    entry.target.classList.add('feature-card--visible')
                    observer.unobserve(entry.target)
                })
            },
            { threshold: 0.2 },
        )
        cards.forEach((card) => observer.observe(card))
        return () => observer.disconnect()
    }, [])

    return (
        <section id="funcionalidades" className="features">
            <div className="features__header">
                <span className="features__label">Funcionalidades</span>
                <h2 className="features__title">Todo lo que necesitas para reportar</h2>
                <p className="features__subtitle">Una plataforma simple y completa para gestionar incidentes del campus.</p>
            </div>

            <div className="features__grid" ref={gridRef}>
                {features.map((f, i) => (
                    <div
                        className="feature-card"
                        key={i}
                        style={{ '--feature-delay': `${i * 140}ms` }}
                        onClick={handlers(i, setModalFoto, setModalGeo)}
                    >
                        <div className="feature-card__icon">{f.icon}</div>
                        <div>
                            <p className="feature-card__title">{f.title}</p>
                            <p className="feature-card__desc">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {modalFoto && (
                <FotoIncidente
                    onClose={() => setModalFoto(false)}
                    onConfirm={(foto) => console.log('Foto seleccionada:', foto)}
                />
            )}

            {modalGeo && (
                <Geolocalizacion
                    onClose={() => setModalGeo(false)}
                    onConfirm={(coords) => console.log('Coordenadas:', coords)}
                />
            )}
        </section>
    )
}

export default Feature
