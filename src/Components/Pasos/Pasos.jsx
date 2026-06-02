import './Pasos.css'

const pasos = [
    { titulo: 'Regístrate',    desc: 'Crea tu cuenta con correo institucional' },
    { titulo: 'Reporta',       desc: 'Llena el formulario y adjunta una foto' },
    { titulo: 'Seguimiento',   desc: 'Revisa el estado de tu reporte' },
    { titulo: 'Notificación',  desc: 'Te avisamos cuando sea resuelto' },
]

const Pasos = () => {
    return (
        <section id="como-funciona" className="pasos">
            <div className="pasos__header">
                <span className="pasos__label">Cómo funciona</span>
                <h2 className="pasos__title">En 4 pasos simples</h2>
                <p className="pasos__subtitle">Reportar un incidente toma menos de 2 minutos.</p>
            </div>

            <div className="pasos__timeline">
                {pasos.map((p, i) => (
                    <div className="paso" key={i}>
                        <div className="paso__left">
                            <div className="paso__linea paso__linea--top" />
                            <div className="paso__numero">{i + 1}</div>
                            <div className="paso__linea paso__linea--bottom" />
                        </div>
                        <div className="paso__content">
                            <h3>{p.titulo}</h3>
                            <p>{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Pasos
