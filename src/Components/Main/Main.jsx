import { useNavigate } from 'react-router-dom'
import './Main.css'
import Button from '../Button/Button'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import LatestIncidents from './LatestIncidents'
import Datos from '../Datos/Datos'

const Main = () => {
    const navigate = useNavigate()
    return (
        <main id="inicio" className="homeMain">
            <section className="information">

                <div className="badge">
                    <LocationOnIcon style={{ fontSize: 16 }} />
                    <span>Sistema de incidentes del campus</span>
                </div>

                <h1>Reporta incidentes en el campus <strong>de forma rápida y sencilla</strong></h1>

                <p>Ayuda a mantener las instalaciones de la Universidad de la Amazonia
                    en óptimas condiciones. Reporta daños eléctricos, fugas de agua,
                    problemas de infraestructura y más.</p>

                <div className="buttons">
                    <Button onClick={() => navigate('/reportar-anonimo')} startIcon={<AddIcon fontSize="small" />}>Reportar incidente</Button>
                    <Button className="btnOutline" startIcon={<VisibilityIcon fontSize="small" />}>Ver incidentes</Button>
                </div>

            </section>
            <hr />
            <LatestIncidents />
            <Datos />

        </main>
    )
}

export default Main
