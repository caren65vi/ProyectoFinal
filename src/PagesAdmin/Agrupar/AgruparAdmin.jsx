import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  collection, doc, onSnapshot, orderBy, query,
  updateDoc, where, getDocs, writeBatch,
} from 'firebase/firestore'
import { db } from '../../FireBase/config'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import './AgruparAdmin.css'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              cls: 'agradm__tipo--electrico',       color: '#EDB02E' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, cls: 'agradm__tipo--infraestructura', color: '#005A7E' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           cls: 'agradm__tipo--plomeria',        color: '#169586' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          cls: 'agradm__tipo--seguridad',       color: '#E81312' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       cls: 'agradm__tipo--otro',            color: '#8fa08e' },
}

const STATE_ALIAS = { abierto: 'reportado', en_proceso: 'analisis', cerrado: 'resuelto' }
const normalizeState = (s) => STATE_ALIAS[s] || s || 'reportado'

const ESTADO_META = {
  reportado: { label: 'Reportado',   cls: 'agradm__badge--reportado' },
  analisis:  { label: 'En análisis', cls: 'agradm__badge--analisis' },
  resuelto:  { label: 'Resuelto',    cls: 'agradm__badge--resuelto' },
}

const ESTADO_ORDER = ['reportado', 'analisis', 'resuelto']

const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d }

const fmtHora = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

const fmtFecha = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const generateGrupoId = () => {
  try { return crypto.randomUUID().slice(0, 8).toUpperCase() }
  catch { return `G${Date.now().toString(36).toUpperCase()}` }
}

/* ── Modal de categoría ── */
const CategoriaModal = ({ tipo, incidentes, onClose, onGrupoCreado }) => {
  const meta       = TIPO_META[tipo] ?? { label: tipo, icon: <HelpOutlineIcon />, cls: 'agradm__tipo--otro', color: '#8fa08e' }
  const sinGrupo   = incidentes.filter(i => !i.grupoId)
  const conGrupo   = incidentes.filter(i => i.grupoId)

  const [selected, setSelected]   = useState(new Set())
  const [nombre, setNombre]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [feedback, setFeedback]   = useState(null)

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selAll = () => setSelected(new Set(sinGrupo.map(i => i.id)))
  const deselAll = () => setSelected(new Set())

  const crear = async () => {
    if (selected.size < 2) { setFeedback('Selecciona al menos 2 incidentes para agrupar.'); return }
    setSaving(true)
    setFeedback(null)
    try {
      const grupoId = generateGrupoId()
      const nombreFinal = nombre.trim() || `Grupo ${meta.label} ${grupoId}`
      const batch = writeBatch(db)
      selected.forEach(id => batch.update(doc(db, 'incidente', id), { grupoId, nombreGrupo: nombreFinal }))
      await batch.commit()
      onGrupoCreado?.(`Grupo "${nombreFinal}" creado con ${selected.size} incidentes.`)
      onClose()
    } catch {
      setFeedback('Error al crear el grupo. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const modal = (
    <div className="agradm__modal-backdrop" onClick={onClose}>
      <div className="agradm__modal" onClick={e => e.stopPropagation()}>

        {/* Cabecera */}
        <header className="agradm__modal-header" style={{ borderBottomColor: meta.color }}>
          <div className="agradm__modal-title">
            <span className={`agradm__tipo-icon ${meta.cls}`}>{meta.icon}</span>
            <div>
              <h2>{meta.label}</h2>
              <span>
                <CalendarTodayOutlinedIcon fontSize="inherit" />
                {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                &nbsp;·&nbsp; {incidentes.length} incidente{incidentes.length !== 1 ? 's' : ''} hoy
              </span>
            </div>
          </div>
          <button className="agradm__modal-close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon fontSize="small" />
          </button>
        </header>

        {/* Cuerpo */}
        <div className="agradm__modal-body">

          {/* Sin grupo — seleccionables */}
          {sinGrupo.length > 0 && (
            <div className="agradm__modal-section">
              <div className="agradm__modal-section-header">
                <span className="agradm__modal-section-label">Sin agrupar ({sinGrupo.length})</span>
                <div className="agradm__modal-selbtns">
                  <button onClick={selAll}>Seleccionar todos</button>
                  <button onClick={deselAll}>Limpiar</button>
                </div>
              </div>

              {sinGrupo.map(inc => {
                const eNorm = normalizeState(inc.estado)
                const eMeta = ESTADO_META[eNorm] ?? { label: eNorm, cls: 'agradm__badge--reportado' }
                const checked = selected.has(inc.id)
                return (
                  <div
                    key={inc.id}
                    className={`agradm__modal-row${checked ? ' agradm__modal-row--checked' : ''}`}
                    onClick={() => toggle(inc.id)}
                  >
                    <span className="agradm__modal-check">
                      {checked ? <CheckBoxOutlinedIcon fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" />}
                    </span>
                    <div className="agradm__modal-row-info">
                      <strong>{inc.descripcion?.slice(0, 60) ?? '(sin descripción)'}…</strong>
                      <span>
                        <LocationOnOutlinedIcon fontSize="inherit" />
                        {inc.ubicacionTextual || '—'}
                        &nbsp;·&nbsp;
                        {fmtHora(inc.createdAt ?? inc.fecha)}
                      </span>
                    </div>
                    <span className={`agradm__estado-badge ${eMeta.cls}`}>{eMeta.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Con grupo — solo visualización */}
          {conGrupo.length > 0 && (
            <div className="agradm__modal-section">
              <div className="agradm__modal-section-header">
                <span className="agradm__modal-section-label agradm__modal-section-label--muted">
                  Ya agrupados ({conGrupo.length})
                </span>
              </div>
              {conGrupo.map(inc => {
                const eNorm = normalizeState(inc.estado)
                const eMeta = ESTADO_META[eNorm] ?? { label: eNorm, cls: 'agradm__badge--reportado' }
                return (
                  <div key={inc.id} className="agradm__modal-row agradm__modal-row--grouped">
                    <span className="agradm__grupo-tag-sm">
                      <AccountTreeOutlinedIcon fontSize="inherit" />
                      {inc.nombreGrupo ?? inc.grupoId}
                    </span>
                    <div className="agradm__modal-row-info">
                      <strong>{inc.descripcion?.slice(0, 60) ?? '(sin descripción)'}…</strong>
                      <span>
                        <LocationOnOutlinedIcon fontSize="inherit" />
                        {inc.ubicacionTextual || '—'}
                        &nbsp;·&nbsp;
                        {fmtHora(inc.createdAt ?? inc.fecha)}
                      </span>
                    </div>
                    <span className={`agradm__estado-badge ${eMeta.cls}`}>{eMeta.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer — crear grupo */}
        {sinGrupo.length > 0 && (
          <footer className="agradm__modal-footer">
            {feedback && <p className="agradm__modal-feedback">{feedback}</p>}
            <div className="agradm__modal-footer-row">
              <input
                className="agradm__nombre-input"
                placeholder={`Nombre del grupo (ej. ${meta.label} bloque A)`}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                maxLength={60}
              />
              <button
                className="agradm__agrupar-btn"
                onClick={crear}
                disabled={saving || selected.size < 2}
              >
                <LinkOutlinedIcon fontSize="small" />
                {saving ? 'Agrupando…' : `Agrupar ${selected.size > 0 ? `(${selected.size})` : ''}`}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

/* ══ Componente principal ══ */
const AgruparAdmin = () => {
  const [all, setAll]             = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('nuevos')
  const [feedback, setFeedback]   = useState(null)
  const [categoriaAbierta, setCategoriaAbierta] = useState(null)
  const [updatingGrupo, setUpdatingGrupo] = useState(null)
  const [expandedGrupo, setExpandedGrupo] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'incidente'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const hoyStart  = startOfToday()
  const sinGrupo  = useMemo(() => all.filter(i => !i.grupoId), [all])

  /* Incidentes de HOY agrupados por tipo (solo los sin grupo) */
  const categorias = useMemo(() => {
    const hoy = all.filter(i => {
      const d = new Date(i.createdAt ?? i.fecha)
      return d >= hoyStart
    })
    const map = {}
    hoy.forEach(i => {
      const t = i.tipo ?? 'otro'
      if (!map[t]) map[t] = []
      map[t].push(i)
    })
    return Object.entries(map)
      .map(([tipo, incs]) => ({ tipo, incs, sinGrupo: incs.filter(i => !i.grupoId).length }))
      .sort((a, b) => b.incs.length - a.incs.length)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all])

  const grupos = useMemo(() => {
    const map = new Map()
    all.filter(i => i.grupoId).forEach(i => {
      if (!map.has(i.grupoId)) map.set(i.grupoId, { grupoId: i.grupoId, nombre: i.nombreGrupo ?? i.grupoId, incidentes: [] })
      map.get(i.grupoId).incidentes.push(i)
    })
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [all])

  const cambiarEstadoGrupo = async (grupoId, newEstado) => {
    setUpdatingGrupo(grupoId)
    try {
      const q    = query(collection(db, 'incidente'), where('grupoId', '==', grupoId))
      const snap = await getDocs(q)
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.update(d.ref, { estado: newEstado, updatedAt: new Date().toISOString() }))
      await batch.commit()
      setFeedback({ ok: true, msg: `Estado actualizado a "${ESTADO_META[newEstado]?.label}" para todos los incidentes del grupo.` })
      setTimeout(() => setFeedback(null), 3500)
    } catch {
      setFeedback({ ok: false, msg: 'Error al actualizar el estado del grupo.' })
    } finally {
      setUpdatingGrupo(null)
    }
  }

  const desagrupar = async (incId) => {
    try { await updateDoc(doc(db, 'incidente', incId), { grupoId: null, nombreGrupo: null }) }
    catch { /* noop */ }
  }

  const onGrupoCreado = (msg) => {
    setFeedback({ ok: true, msg })
    setTab('grupos')
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="agradm">

      {/* Encabezado */}
      <header className="agradm__header">
        <div className="agradm__header-text">
          <span className="agradm__eyebrow">Panel administrativo</span>
          <h1 className="agradm__title">Agrupar Incidentes</h1>
          <p className="agradm__subtitle">
            Agrupa reportes relacionados. Al cambiar el estado de un grupo,
            se actualiza en todos sus incidentes simultáneamente.
          </p>
        </div>
        <div className="agradm__header-stats">
          <div className="agradm__stat">
            <span className="agradm__stat-num">{sinGrupo.length}</span>
            <span className="agradm__stat-label">Sin agrupar</span>
          </div>
          <div className="agradm__stat agradm__stat--grupos">
            <span className="agradm__stat-num">{grupos.length}</span>
            <span className="agradm__stat-label">Grupos</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="agradm__tabs">
        <button
          className={`agradm__tab${tab === 'nuevos' ? ' agradm__tab--active' : ''}`}
          onClick={() => setTab('nuevos')}
        >
          <LinkOutlinedIcon fontSize="small" />
          Crear grupo
          {categorias.length > 0 && <span className="agradm__tab-count">{categorias.length}</span>}
        </button>
        <button
          className={`agradm__tab${tab === 'grupos' ? ' agradm__tab--active' : ''}`}
          onClick={() => setTab('grupos')}
        >
          <AccountTreeOutlinedIcon fontSize="small" />
          Grupos existentes
          {grupos.length > 0 && <span className="agradm__tab-count">{grupos.length}</span>}
        </button>
      </div>

      {feedback && (
        <p className={`agradm__feedback${feedback.ok ? ' agradm__feedback--ok' : ' agradm__feedback--err'}`}>
          {feedback.msg}
        </p>
      )}

      {/* ══ TAB: CATEGORÍAS DEL DÍA ══ */}
      {tab === 'nuevos' && (
        <div className="agradm__panel">
          <div className="agradm__cat-header">
            <span>Categorías reportadas hoy</span>
            <span className="agradm__list-hint">Toca una categoría para ver sus incidentes</span>
          </div>

          {loading ? (
            <div className="agradm__cat-grid">
              {[1,2,3,4].map(i => <div key={i} className="agradm__cat-card agradm__cat-card--skeleton" />)}
            </div>
          ) : categorias.length === 0 ? (
            <div className="agradm__empty">
              <AccountTreeOutlinedIcon sx={{ fontSize: 44 }} />
              <p>No hay incidentes reportados hoy.</p>
            </div>
          ) : (
            <div className="agradm__cat-grid">
              {categorias.map(({ tipo, incs, sinGrupo: sg }) => {
                const meta = TIPO_META[tipo] ?? { label: tipo, icon: <HelpOutlineIcon />, cls: 'agradm__tipo--otro', color: '#8fa08e' }
                return (
                  <button
                    key={tipo}
                    className="agradm__cat-card"
                    style={{ '--cat-color': meta.color }}
                    onClick={() => setCategoriaAbierta({ tipo, incidentes: incs })}
                  >
                    <span className={`agradm__cat-icon ${meta.cls}`}>{meta.icon}</span>
                    <div className="agradm__cat-info">
                      <strong>{meta.label}</strong>
                      <span>{incs.length} reporte{incs.length !== 1 ? 's' : ''} hoy</span>
                    </div>
                    <div className="agradm__cat-badges">
                      <span className="agradm__cat-total">{incs.length}</span>
                      {sg > 0 && (
                        <span className="agradm__cat-sin">{sg} sin grupo</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: GRUPOS EXISTENTES ══ */}
      {tab === 'grupos' && (
        <div className="agradm__panel">
          {grupos.length === 0 ? (
            <div className="agradm__empty">
              <AccountTreeOutlinedIcon sx={{ fontSize: 44 }} />
              <p>No hay grupos creados aún. Ve a "Crear grupo" para comenzar.</p>
            </div>
          ) : (
            <div className="agradm__grupos">
              {grupos.map(({ grupoId, nombre, incidentes }) => {
                const isExpanded = expandedGrupo === grupoId
                const isUpdating = updatingGrupo === grupoId
                const estadosGrupo = incidentes.reduce((acc, i) => {
                  const e = normalizeState(i.estado)
                  acc[e] = (acc[e] || 0) + 1
                  return acc
                }, {})

                return (
                  <div key={grupoId} className="agradm__grupo-card">
                    <div
                      className="agradm__grupo-header"
                      onClick={() => setExpandedGrupo(isExpanded ? null : grupoId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === ' ' && setExpandedGrupo(isExpanded ? null : grupoId)}
                    >
                      <div className="agradm__grupo-info">
                        <AccountTreeOutlinedIcon className="agradm__grupo-icon" />
                        <div>
                          <strong className="agradm__grupo-nombre">{nombre}</strong>
                          <span className="agradm__grupo-id">ID: {grupoId}</span>
                        </div>
                      </div>
                      <div className="agradm__grupo-meta">
                        <span className="agradm__grupo-count">
                          {incidentes.length} incidente{incidentes.length !== 1 ? 's' : ''}
                        </span>
                        {Object.entries(estadosGrupo).map(([e, n]) => (
                          <span key={e} className={`agradm__estado-badge agradm__estado-badge--sm ${ESTADO_META[e]?.cls}`}>
                            {n} {ESTADO_META[e]?.label}
                          </span>
                        ))}
                        <span className="agradm__grupo-arrow">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    <div className="agradm__grupo-estado-bar">
                      <span className="agradm__grupo-estado-label">
                        <ArrowForwardIcon fontSize="small" />
                        Cambiar estado de todo el grupo:
                      </span>
                      <div className="agradm__grupo-estado-btns">
                        {ESTADO_ORDER.map(key => (
                          <button
                            key={key}
                            className={`agradm__grupo-btn agradm__grupo-btn--${key}`}
                            onClick={() => cambiarEstadoGrupo(grupoId, key)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? '…' : ESTADO_META[key].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="agradm__grupo-body">
                        {incidentes.map(inc => {
                          const tipo  = TIPO_META[inc.tipo] ?? { label: inc.tipo, icon: <HelpOutlineIcon />, cls: 'agradm__tipo--otro' }
                          const eNorm = normalizeState(inc.estado)
                          const eMeta = ESTADO_META[eNorm] ?? { label: eNorm, cls: 'agradm__badge--reportado' }
                          return (
                            <div key={inc.id} className="agradm__grupo-row">
                              <span className={`agradm__tipo-icon agradm__tipo-icon--sm ${tipo.cls}`}>{tipo.icon}</span>
                              <div className="agradm__row-info">
                                <strong>{tipo.label}</strong>
                                <span>{inc.descripcion?.slice(0, 45) ?? ''}…</span>
                              </div>
                              <span className="agradm__row-fecha agradm__row-fecha--sm">
                                {fmtFecha(inc.createdAt ?? inc.fecha)}
                              </span>
                              <span className={`agradm__estado-badge agradm__estado-badge--sm ${eMeta.cls}`}>
                                {eMeta.label}
                              </span>
                              <button
                                className="agradm__desagrupar-btn"
                                onClick={() => desagrupar(inc.id)}
                                title="Quitar del grupo"
                              >
                                <LinkOffOutlinedIcon fontSize="small" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de categoría */}
      {categoriaAbierta && (
        <CategoriaModal
          tipo={categoriaAbierta.tipo}
          incidentes={categoriaAbierta.incidentes}
          onClose={() => setCategoriaAbierta(null)}
          onGrupoCreado={onGrupoCreado}
        />
      )}
    </div>
  )
}

export default AgruparAdmin
