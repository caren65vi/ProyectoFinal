import { useEffect, useState } from 'react'
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { onAuthChange } from '../../FireBase/auth'
import { db } from '../../FireBase/config'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import './ModalSetPassword.css'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/
const SPECIAL_REGEX = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/

const isSocialOnly = (firebaseUser) =>
  !firebaseUser?.providerData?.some((p) => p.providerId === 'password')

const ModalSetPassword = () => {
  const [show, setShow] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (!fbUser || !isSocialOnly(fbUser)) {
        setShow(false)
        return
      }
      setFirebaseUser(fbUser)
      try {
        const snap = await getDoc(doc(db, 'usuarios', fbUser.uid))
        if (!snap.exists()) return
        const data = snap.data()
        if (!data.hasSeenPasswordModal) {
          setShow(true)
        }
      } catch {
        // sin acceso al perfil, no mostrar modal
      }
    })
    return () => unsub()
  }, [])

  const markSeen = async () => {
    if (!firebaseUser) return
    try {
      await updateDoc(doc(db, 'usuarios', firebaseUser.uid), {
        hasSeenPasswordModal: true,
      })
    } catch {
      // The profile flag is optional; dismiss the modal even if it cannot be saved.
    }
  }

  const handleDismiss = async () => {
    await markSeen()
    setShow(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)

    if (!PASSWORD_REGEX.test(newPass)) {
      setMsg({ type: 'error', text: 'La contraseña no cumple todos los requisitos.' })
      return
    }
    if (newPass !== confirmPass) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, newPass)
      await linkWithCredential(firebaseUser, credential)
      await markSeen()
      setDone(true)
      setTimeout(() => setShow(false), 2800)
    } catch (err) {
      const errMsgs = {
        'auth/weak-password': 'La contraseña es demasiado débil.',
        'auth/provider-already-linked': 'Ya tienes una contraseña establecida en esta cuenta.',
      }
      setMsg({ type: 'error', text: errMsgs[err.code] || 'Ocurrió un error. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const rules = [
    { met: newPass.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(newPass), text: 'Una mayúscula (A–Z)' },
    { met: /[a-z]/.test(newPass), text: 'Una minúscula (a–z)' },
    { met: SPECIAL_REGEX.test(newPass), text: 'Un carácter especial (!@#$…)' },
  ]

  if (!show) return null

  return (
    <div className="mspOverlay" role="dialog" aria-modal="true" aria-label="Establecer contraseña">
      <div className="mspCard">

        {/* Botón cerrar */}
        <button className="mspCloseBtn" onClick={handleDismiss} aria-label="Cerrar">
          <CloseIcon fontSize="small" />
        </button>

        {/* Ícono central */}
        <div className="mspIconWrap">
          <LockOutlinedIcon style={{ fontSize: 28 }} />
        </div>

        {done ? (
          /* ── Pantalla de éxito ── */
          <div className="mspSuccess">
            <CheckCircleIcon style={{ fontSize: 48, color: 'var(--success)' }} />
            <p className="mspSuccessTitle">¡Contraseña establecida!</p>
            <p className="mspSuccessText">Ya puedes iniciar sesión con tu correo y contraseña.</p>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <h2 className="mspTitle">Protege tu cuenta</h2>
            <p className="mspDesc">
              Ingresaste con <strong>Google</strong> o <strong>Microsoft</strong>. Establece una
              contraseña para poder acceder también con tu correo electrónico.
            </p>

            {msg && (
              <div className={`mspAlert mspAlert--${msg.type}`}>{msg.text}</div>
            )}

            <form className="mspForm" onSubmit={handleSubmit} noValidate>
              {/* Nueva contraseña */}
              <div className="mspField">
                <label className="mspLabel" htmlFor="mspNewPass">Nueva contraseña</label>
                <div className="mspInputWrap">
                  <input
                    id="mspNewPass"
                    type={showNew ? 'text' : 'password'}
                    className="mspInput"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="mspToggle"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNew
                      ? <VisibilityOffIcon style={{ fontSize: 17 }} />
                      : <VisibilityIcon style={{ fontSize: 17 }} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="mspField">
                <label className="mspLabel" htmlFor="mspConfirmPass">Confirmar contraseña</label>
                <div className="mspInputWrap">
                  <input
                    id="mspConfirmPass"
                    type={showConfirm ? 'text' : 'password'}
                    className="mspInput"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="mspToggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm
                      ? <VisibilityOffIcon style={{ fontSize: 17 }} />
                      : <VisibilityIcon style={{ fontSize: 17 }} />}
                  </button>
                </div>
                {confirmPass && newPass !== confirmPass && (
                  <span className="mspMatchErr">Las contraseñas no coinciden.</span>
                )}
              </div>

              {/* Requisitos */}
              <ul className="mspRules">
                {rules.map((r) => (
                  <li key={r.text} className={`mspRule${r.met ? ' mspRuleOk' : ''}`}>
                    {r.met
                      ? <CheckCircleOutlineIcon style={{ fontSize: 13 }} />
                      : <RadioButtonUncheckedIcon style={{ fontSize: 13 }} />}
                    {r.text}
                  </li>
                ))}
              </ul>

              {/* Acciones */}
              <div className="mspFooter">
                <button
                  type="button"
                  className="mspBtnLater"
                  onClick={handleDismiss}
                  disabled={loading}
                >
                  Más tarde
                </button>
                <button
                  type="submit"
                  className="mspBtnSubmit"
                  disabled={loading}
                >
                  {loading ? 'Estableciendo…' : 'Establecer contraseña'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalSetPassword
