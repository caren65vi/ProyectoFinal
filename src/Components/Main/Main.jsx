import React from 'react'
import './Main.css'
import Button from '../Button/Button'

const Main = () => {
    return (
        <main>
            <section className="information">

                <h1>Reporta incidentes en el campus de forma rápida y sencilla</h1>
                <p>Ayuda a mantener las instalaciones de la Universidad de la Amazonia
                    en óptimas condiciones. Reporta daños eléctricos, fugas de agua,
                    problemas de infraestructura y más.</p>


                <div className="buttons">
                    <Button className="btn--primary">Reportar incidente</Button>
                    <Button className="btn--outline">Ver incidentes reportados</Button>
                </div>

            </section>

            <section className="additional-info">
                <div></div>
                <div></div>
                <div></div>

            </section>

        </main>
    )
}

export default Main
