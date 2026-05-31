import React, { useEffect, useRef } from 'react'
import './Feature.css'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import NotificationsIcon from '@mui/icons-material/Notifications'

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

const Feature = () => {
    const gridRef = useRef(null)

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
        <section className="features">
            <div className="features__header">
                <span className="features__label">Funcionalidades</span>
                <h2 className="features__title">Todo lo que necesitas para reportar</h2>
                <p className="features__subtitle">Una plataforma simple y completa para gestionar incidentes del campus.</p>
            </div>

            <div className="features__grid" ref={gridRef}>
                {features.map((f, i) => (
                    <div className="feature-card" key={i} style={{ '--feature-delay': `${i * 140}ms` }}>
                        <div className="feature-card__icon">{f.icon}</div>
                        <div>
                            <p className="feature-card__title">{f.title}</p>
                            <p className="feature-card__desc">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Feature
