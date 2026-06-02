import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthChange } from '../../FireBase/auth'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import { useNavigate } from 'react-router-dom'
import DetalleIncidenteAdmin from '../../Components/DetalleIncidenteAdmin/DetalleIncidenteAdmin'
import './DashboardAdmin.css'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              color: '#EDB02E' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, color: '#005A7E' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           color: '#169586' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          color: '#E81312' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       color: '#8fa08e' },
}

const STATE_ALIAS = { abierto: 'reportado', en_proceso: 'analisis', cerrado: 'resuelto' }
const normalizeState = (s) => STATE_ALIAS[s] || s || 'reportado'

const ESTADO_META = {
  reportado: { label: 'Reportado',   cls: 'dadm__badge--reportado' },
  analisis:  { label: 'En análisis', cls: 'dadm__badge--analisis' },
  resuelto:  { label: 'Resuelto',    cls: 'dadm__badge--resuelto' },
}

const startOfDay = (d = new Date()) => {
  const r = new Date(d); r.setHours(0,0,0,0); return r
}
const endOfDay = (d = new Date()) => {
  const r = new Date(d); r.setHours(23,59,59,999); return r
}
const diffDays = (iso) => {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

const fmtHora = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

const fmtFecha = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

const hoyLabel = () => new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

/* Barra horizontal simple */
const Bar = ({ pct, color }) => (
  <div className="dadm__bar-track">
    <div className="dadm__bar-fill" style={{ width: `${pct}%`, background: color }} />
  </div>
)

const DashboardAdmin = () => {
  const navigate = useNavigate()
  const [all, setAll]           = useState([])
  const [loading, setLoading]   = useState(true)
  const [nombre, setNombre]     = useState('Administrador')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (!u) return
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid))
        const n = snap.exists() ? snap.data()?.nombre : null
        setNombre(typeof n === 'string' && n.trim() ? n.trim() : 'Administrador')
      } catch { /* noop */ }
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'incidente'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  /* ── Datos de HOY ── */
  const hoyStart = startOfDay()
  const hoyEnd   = endOfDay()

  const { hoy, total, recientes, alertas, porTipo, actividad } = useMemo(() => {
    const hoyIncs = all.filter(i => {
      const d = new Date(i.createdAt ?? i.fecha)
      return d >= hoyStart && d <= hoyEnd
    })

    const sinAtender = all.filter(i =>
      normalizeState(i.estado) === 'reportado' && diffDays(i.createdAt ?? i.fecha) > 7
    )
    const nuevosHoy    = hoyIncs.length
    const cambiosHoy   = all.filter(i => i.updatedAt && diffDays(i.updatedAt) === 0)
    const agrupados    = all.filter(i => i.grupoId && diffDays(i.createdAt ?? i.fecha) <= 1)

    const alertList = []
    if (sinAtender.length > 0)
      alertList.push({ nivel: 'danger', msg: `${sinAtender.length} incidente${sinAtender.length > 1 ? 's llevan' : ' lleva'} más de 7 días sin cambio de estado.`, action: 'Revisar ahora', path: '/admin/incidentes' })
    if (nuevosHoy > 0)
      alertList.push({ nivel: 'info', msg: `${nuevosHoy} incidente${nuevosHoy > 1 ? 's nuevos' : ' nuevo'} registrado${nuevosHoy > 1 ? 's' : ''} hoy en el campus.`, action: 'Ver incidentes', path: '/admin/incidentes' })
    if (cambiosHoy.length > 0)
      alertList.push({ nivel: 'success', msg: `${cambiosHoy.length} incidente${cambiosHoy.length > 1 ? 's' : ''} actualizados hoy.`, action: null })
    if (agrupados.length > 0)
      alertList.push({ nivel: 'warning', msg: `${agrupados.length} incidente${agrupados.length > 1 ? 's' : ''} reciente${agrupados.length > 1 ? 's' : ''} con grupo asignado.`, action: 'Ver grupos', path: '/admin/agrupar' })

    const tipoMap = Object.fromEntries(Object.keys(TIPO_META).map(k => [k, 0]))
    hoyIncs.forEach(i => {
      if (tipoMap[i.tipo] !== undefined) tipoMap[i.tipo]++
      else tipoMap.otro++
    })

    const activReciente = all
      .filter(i => i.updatedAt && diffDays(i.updatedAt) <= 3)
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
      .slice(0, 6)

    return {
      hoy:      hoyIncs,
      total:    { rep: hoyIncs.filter(i => normalizeState(i.estado) === 'reportado').length,
                  ana: hoyIncs.filter(i => normalizeState(i.estado) === 'analisis').length,
                  res: hoyIncs.filter(i => normalizeState(i.estado) === 'resuelto').length },
      recientes: hoyIncs.slice(0, 5),
      alertas:  alertList,
      porTipo:  tipoMap,
      actividad: activReciente,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all])

  const maxTipo = Math.max(...Object.values(porTipo), 1)
  const totalHoy = hoy.length

  const handleUpdate = (updated) => {
    setAll(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
    if (selected?.id === updated.id) setSelected(prev => ({ ...prev, ...updated }))
  }

  if (loading) return (
    <div className="dadm dadm--loading">
      <div className="dadm__skel dadm__skel--header" />
      <div className="dadm__skel-cards">
        {[1,2,3,4].map(i => <div key={i} className="dadm__skel dadm__skel--card" />)}
      </div>
    </div>
  )

  return (
    <div className="dadm">

      {/* ── Encabezado ── */}
      <header className="dadm__header">
        <div>
          <span className="dadm__eyebrow">Panel administrativo</span>
          <h1 className="dadm__title">Dashboard general</h1>
          <p className="dadm__subtitle">
            Bienvenido, <strong>{nombre}</strong> — {hoyLabel()}
          </p>
        </div>
        <div className="dadm__header-actions">
          <button className="dadm__link-btn" onClick={() => navigate('/admin/estadisticas')}>
            Ver estadísticas
          </button>
          <button className="dadm__primary-btn" onClick={() => navigate('/admin/incidentes')}>
            Gestionar incidentes
          </button>
        </div>
      </header>

      {/* ── Tarjetas de hoy ── */}
      <div className="dadm__cards">
        <div className="dadm__card dadm__card--total">
          <div className="dadm__card-icon"><TrendingUpIcon /></div>
          <div className="dadm__card-body">
            <span className="dadm__card-num">{totalHoy}</span>
            <span className="dadm__card-label">Incidentes hoy</span>
            <span className="dadm__card-note">registrados en el día</span>
          </div>
        </div>
        <div className="dadm__card dadm__card--rep">
          <div className="dadm__card-icon"><ReportOutlinedIcon /></div>
          <div className="dadm__card-body">
            <span className="dadm__card-num">{total.rep}</span>
            <span className="dadm__card-label">Reportados</span>
            <span className="dadm__card-note">sin atender aún</span>
          </div>
        </div>
        <div className="dadm__card dadm__card--ana">
          <div className="dadm__card-icon"><HourglassEmptyIcon /></div>
          <div className="dadm__card-body">
            <span className="dadm__card-num">{total.ana}</span>
            <span className="dadm__card-label">En análisis</span>
            <span className="dadm__card-note">en atención activa</span>
          </div>
        </div>
        <div className="dadm__card dadm__card--res">
          <div className="dadm__card-icon"><CheckCircleOutlinedIcon /></div>
          <div className="dadm__card-body">
            <span className="dadm__card-num">{total.res}</span>
            <span className="dadm__card-label">Resueltos</span>
            <span className="dadm__card-note">
              tasa: {totalHoy > 0 ? Math.round((total.res / totalHoy) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Fila principal ── */}
      <div className="dadm__main-row">

        {/* Incidentes de hoy */}
        <div className="dadm__section dadm__section--recientes">
          <div className="dadm__section-header">
            <strong>Incidentes de hoy</strong>
            <button className="dadm__ver-todos" onClick={() => navigate('/admin/incidentes')}>
              Ver todos
            </button>
          </div>

          {recientes.length === 0 ? (
            <div className="dadm__empty">
              <CheckCircleOutlinedIcon />
              <span>No hay incidentes registrados hoy.</span>
            </div>
          ) : (
            <>
              <div className="dadm__table-head">
                <span>Incidente</span>
                <span>Estado</span>
                <span>Acción</span>
              </div>
              {recientes.map(inc => {
                const tipo  = TIPO_META[inc.tipo] ?? { label: inc.tipo, color: '#8fa08e', icon: <HelpOutlineIcon /> }
                const eNorm = normalizeState(inc.estado)
                const eMeta = ESTADO_META[eNorm] ?? { label: eNorm, cls: 'dadm__badge--reportado' }
                return (
                  <div key={inc.id} className="dadm__table-row">
                    <div className="dadm__inc-cell">
                      <span
                        className="dadm__tipo-dot"
                        style={{ background: tipo.color }}
                        title={tipo.label}
                      />
                      <div className="dadm__inc-info">
                        <strong style={{ color: tipo.color }}>{tipo.label}</strong>
                        <span>{inc.descripcion?.slice(0, 28) ?? ''}…</span>
                        <span className="dadm__inc-hora">{fmtHora(inc.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`dadm__badge ${eMeta.cls}`}>{eMeta.label}</span>
                    <div className="dadm__row-actions">
                      <button
                        className="dadm__action-btn"
                        title="Ver detalle"
                        onClick={() => setSelected(inc)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Alertas del sistema */}
        <div className="dadm__section dadm__section--alertas">
          <div className="dadm__section-header">
            <strong>Alertas del sistema</strong>
            <button className="dadm__ver-todos" onClick={() => navigate('/admin/incidentes')}>
              Ver todas
            </button>
          </div>
          {alertas.length === 0 ? (
            <div className="dadm__empty">
              <CheckCircleOutlinedIcon />
              <span>Sin alertas activas hoy.</span>
            </div>
          ) : (
            <div className="dadm__alertas-list">
              {alertas.map((a, idx) => (
                <div key={idx} className={`dadm__alerta dadm__alerta--${a.nivel}`}>
                  <span className="dadm__alerta-dot" />
                  <div className="dadm__alerta-body">
                    <p>{a.msg}</p>
                    {a.action && (
                      <button
                        className="dadm__alerta-link"
                        onClick={() => navigate(a.path)}
                      >
                        {a.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fila inferior ── */}
      <div className="dadm__bottom-row">

        {/* Incidentes de hoy por tipo */}
        <div className="dadm__section dadm__section--tipo">
          <div className="dadm__section-header">
            <strong>Por tipo — hoy</strong>
          </div>
          {totalHoy === 0 ? (
            <div className="dadm__empty"><span>Sin incidentes hoy.</span></div>
          ) : (
            <div className="dadm__tipo-chart">
              {Object.entries(TIPO_META).map(([key, meta]) => {
                const count = porTipo[key] ?? 0
                return (
                  <div key={key} className="dadm__tipo-bar-row">
                    <div className="dadm__tipo-label">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                    <Bar pct={maxTipo > 0 ? (count / maxTipo) * 100 : 0} color={meta.color} />
                    <span className="dadm__tipo-count">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Resolución por estado — global */}
        <div className="dadm__section dadm__section--estado">
          <div className="dadm__section-header">
            <strong>Resolución por estado</strong>
            <span className="dadm__section-sub">Total acumulado</span>
          </div>
          {all.length === 0 ? (
            <div className="dadm__empty"><span>Sin datos.</span></div>
          ) : (
            <div className="dadm__estado-chart">
              {[
                { key: 'reportado', label: 'Reportados',  color: '#EDB02E' },
                { key: 'analisis',  label: 'En proceso',  color: '#005A7E' },
                { key: 'resuelto',  label: 'Resueltos',   color: '#0B750E' },
              ].map(({ key, label, color }) => {
                const n   = all.filter(i => normalizeState(i.estado) === key).length
                const pct = all.length > 0 ? Math.round((n / all.length) * 100) : 0
                return (
                  <div key={key} className="dadm__estado-row">
                    <div className="dadm__estado-top">
                      <span>{label}</span>
                      <strong style={{ color }}>{pct}%</strong>
                    </div>
                    <Bar pct={pct} color={color} />
                  </div>
                )
              })}
              <div className="dadm__tasa-row">
                <span>Tasa de resolución</span>
                <strong style={{ color: 'var(--accent)' }}>
                  {all.length > 0
                    ? Math.round((all.filter(i => normalizeState(i.estado) === 'resuelto').length / all.length) * 100)
                    : 0}%
                </strong>
              </div>
              <Bar
                pct={all.length > 0
                  ? (all.filter(i => normalizeState(i.estado) === 'resuelto').length / all.length) * 100
                  : 0}
                color="var(--accent)"
              />
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="dadm__section dadm__section--actividad">
          <div className="dadm__section-header">
            <strong>Actividad reciente</strong>
            <span className="dadm__section-sub">Últimos 3 días</span>
          </div>
          {actividad.length === 0 ? (
            <div className="dadm__empty"><span>Sin actividad reciente.</span></div>
          ) : (
            <div className="dadm__actividad-list">
              {actividad.map(inc => {
                const tipo  = TIPO_META[inc.tipo] ?? { label: inc.tipo, color: '#8fa08e', icon: <HelpOutlineIcon /> }
                const eNorm = normalizeState(inc.estado)
                const eMeta = ESTADO_META[eNorm] ?? { label: eNorm, cls: 'dadm__badge--reportado' }
                const esGrupo = Boolean(inc.grupoId)
                return (
                  <div key={inc.id} className="dadm__act-row" onClick={() => setSelected(inc)}>
                    <span className="dadm__act-icon" style={{ background: `${tipo.color}20`, color: tipo.color }}>
                      {esGrupo ? <AccountTreeOutlinedIcon fontSize="small" /> : <SyncAltIcon fontSize="small" />}
                    </span>
                    <div className="dadm__act-info">
                      <strong>
                        {inc.id?.slice(0, 6).toUpperCase()}{' '}
                        <span style={{ color: tipo.color }}>{tipo.label}</span>
                      </strong>
                      <span>
                        cambiado a <b>{eMeta.label}</b>
                      </span>
                      <span className="dadm__act-fecha">{fmtFecha(inc.updatedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal de detalle */}
      {selected && (
        <DetalleIncidenteAdmin
          incident={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default DashboardAdmin
