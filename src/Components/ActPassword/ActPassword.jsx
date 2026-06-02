import { useState } from 'react'
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import './ActPassword.css'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/
const SPECIAL_REGEX = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/

const hasPasswordProvider = (firebaseUser) =>
  firebaseUser?.providerData?.some((p) => p.providerId === 'password') ?? false

const PasswordInput = ({ label, id, value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="apField">
      <label className="apLabel" htmlFor={id}>{label}</label>
      <div className="apInputWrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="apInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="apToggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible
            ? <VisibilityOffIcon style={{ fontSize: 18 }} />
            : <VisibilityIcon style={{ fontSize: 18 }} />}
        </button>
      </div>
    </div>
  )
}

const StrengthBar = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    SPECIAL_REGEX.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const colors = ['', '#E81312', '#EDB02E', '#34AB1E', '#0B750E']

  if (!password) return null

  return (
    <div className="apStrength">
      <div className="apStrengthBars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="apStrengthBar"
            style={{ background: i <= score ? colors[score] : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="apStrengthLabel" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  )
}

const RuleItem = ({ met, text }) => (
  <li className={`apRule${met ? ' apRuleOk' : ''}`}>
    {met
      ? <CheckCircleOutlineIcon style={{ fontSize: 14 }} />
      : <RadioButtonUncheckedIcon style={{ fontSize: 14 }} />}
    {text}
  </li>
)

const ActPassword = ({ firebaseUser }) => {
  const hasPass = hasPasswordProvider(firebaseUser)

  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const rules = [
    { met: newPass.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(newPass), text: 'Al menos una mayúscula (A–Z)' },
    { met: /[a-z]/.test(newPass), text: 'Al menos una minúscula (a–z)' },
    { met: SPECIAL_REGEX.test(newPass), text: 'Un carácter especial (!@#$…)' },
  ]

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const validate = () => {
    if (hasPass && !currentPass) {
      showMsg('error', 'Ingresa tu contraseña actual.')
      return false
    }
    if (!PASSWORD_REGEX.test(newPass)) {
      showMsg('error', 'La contraseña no cumple todos los requisitos.')
      return false
    }
    if (newPass !== confirmPass) {
      showMsg('error', 'Las contraseñas no coinciden.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setMsg(null)

    try {
      if (hasPass) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass)
        await reauthenticateWithCredential(firebaseUser, credential)
        await updatePassword(firebaseUser, newPass)
        showMsg('success', '¡Contraseña actualizada correctamente!')
      } else {
        const credential = EmailAuthProvider.credential(firebaseUser.email, newPass)
        await linkWithCredential(firebaseUser, credential)
        showMsg('success', '¡Contraseña establecida! Ya puedes iniciar sesión también con tu correo.')
      }
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      const errMsgs = {
        'auth/wrong-password': 'La contraseña actual es incorrecta.',
        'auth/invalid-credential': 'La contraseña actual es incorrecta.',
        'auth/weak-password': 'La contraseña es demasiado débil.',
        'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a ingresar e intenta de nuevo.',
        'auth/provider-already-linked': 'Ya tienes una contraseña vinculada a esta cuenta.',
      }
      showMsg('error', errMsgs[err.code] || `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apCard">
      <div className="apCardHeader">
        <div className="apCardHeaderLeft">
          <div className="apIconWrap">
            <LockIcon style={{ fontSize: 18 }} />
          </div>
          <h2 className="apCardTitle">
            {hasPass ? 'Cambiar contraseña' : 'Establecer contraseña'}
          </h2>
        </div>
      </div>

      {!hasPass && (
        <p className="apNote">
          Tu cuenta está vinculada con Google o Microsoft. Puedes establecer una contraseña
          para acceder también con tu correo electrónico.
        </p>
      )}

      {msg && (
        <div className={`apAlert apAlert--${msg.type}`}>{msg.text}</div>
      )}

      <form className="apForm" onSubmit={handleSubmit} noValidate>
        {hasPass && (
          <PasswordInput
            label="Contraseña actual"
            id="apCurrentPass"
            value={currentPass}
            onChange={setCurrentPass}
            placeholder="Tu contraseña actual"
          />
        )}

        <PasswordInput
          label="Nueva contraseña"
          id="apNewPass"
          value={newPass}
          onChange={setNewPass}
          placeholder="Mín. 8 caracteres"
        />

        <StrengthBar password={newPass} />

        <PasswordInput
          label="Confirmar nueva contraseña"
          id="apConfirmPass"
          value={confirmPass}
          onChange={setConfirmPass}
          placeholder="Repite la contraseña"
        />

        {confirmPass && newPass !== confirmPass && (
          <span className="apMatchError">Las contraseñas no coinciden.</span>
        )}

        <ul className="apRules">
          {rules.map((r) => (
            <RuleItem key={r.text} met={r.met} text={r.text} />
          ))}
        </ul>

        <button
          type="submit"
          className="apSubmitBtn"
          disabled={loading}
        >
          {loading
            ? 'Procesando…'
            : hasPass
            ? 'Actualizar contraseña'
            : 'Establecer contraseña'}
        </button>
      </form>
    </div>
  )
}

export default ActPassword
