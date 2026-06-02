import './Consejos.css'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'

<span className="consejos__icon">{icon}</span>

const Consejos = () => {
  return (
    <aside className="consejos">
      <div className="consejos__header">
        <span className="consejos__titulo">Consejos</span>
      </div>
      <ul className="consejos__lista">
        {consejos.map(({ icon, text, color }, i) => (
          <li key={i} className="consejos__item">
            <span className={`consejos__icon consejos__icon--${color}`}>{icon}</span>
            <p className="consejos__text">{text}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Consejos
