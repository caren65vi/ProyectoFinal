import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import './ImprimirAdmin.css'

const STATE_ALIAS = { abierto: 'reportado', en_proceso: 'analisis', cerrado: 'resuelto' }
const normalizeState = (s) => STATE_ALIAS[s] || s || 'reportado'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              color: '#EDB02E' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, color: '#005A7E' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           color: '#169586' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          color: '#E81312' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       color: '#8fa08e' },
}

const ESTADO_META = {
  reportado: { label: 'Reportado',   color: '#b8881f' },
  analisis:  { label: 'En análisis', color: '#005A7E' },
  resuelto:  { label: 'Resuelto',    color: '#0B750E' },
}

const fmt = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  } catch { return iso }
}

const fmtShort = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return iso }
}

const ENTIDADES = [
  { key: 'incidentes', label: 'Reporte de Incidentes', icon: <FormatListBulletedIcon /> },
  { key: 'usuarios',   label: 'Listado de Usuarios',   icon: <GroupOutlinedIcon /> },
]

const ImprimirAdmin = () => {
  const [incidentes, setIncidentes] = useState([])
  const [usuarios, setUsuarios]     = useState([])
  const [loading, setLoading]       = useState(true)

  const [entidad, setEntidad]         = useState('incidentes')
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().slice(0, 10))
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo]     = useState('todos')
  const printRef = useRef(null)

  useEffect(() => {
    let done1 = false, done2 = false
    const check = () => { if (done1 && done2) setLoading(false) }

    const q1 = query(collection(db, 'incidente'), orderBy('createdAt', 'desc'))
    const unsub1 = onSnapshot(q1, snap => {
      setIncidentes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done1 = true; check()
    })

    const q2 = query(collection(db, 'usuarios'), orderBy('creadoEn', 'desc'))
    const unsub2 = onSnapshot(q2, snap => {
      setUsuarios(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
      done2 = true; check()
    })

    return () => { unsub1(); unsub2() }
  }, [])

  const incidentesFiltrados = useMemo(() => {
    const start = new Date(fechaInicio)
    const end   = new Date(fechaFin); end.setHours(23, 59, 59)
    return incidentes.filter(i => {
      const d = new Date(i.createdAt ?? i.fecha)
      if (d < start || d > end) return false
      if (filtroEstado !== 'todos' && normalizeState(i.estado) !== filtroEstado) return false
      if (filtroTipo   !== 'todos' && i.tipo !== filtroTipo) return false
      return true
    })
  }, [incidentes, fechaInicio, fechaFin, filtroEstado, filtroTipo])

  const usuariosFiltrados = useMemo(() => {
    const start = new Date(fechaInicio)
    const end   = new Date(fechaFin); end.setHours(23, 59, 59)
    return usuarios.filter(u => {
      const d = new Date(u.creadoEn)
      return d >= start && d <= end
    })
  }, [usuarios, fechaInicio, fechaFin])

  const datos = entidad === 'incidentes' ? incidentesFiltrados : usuariosFiltrados
  const genDate = fmt(new Date().toISOString())
  const rangoLabel = `${fmtShort(fechaInicio)} — ${fmtShort(fechaFin)}`

  const handlePrint = () => window.print()

  return (
    <div className="impadm">

      {/* ── Encabezado ── */}
      <header className="impadm__header">
        <div>
          <span className="impadm__eyebrow">Panel administrativo</span>
          <h1 className="impadm__title">Imprimir Reportes</h1>
          <p className="impadm__subtitle">Genera e imprime reportes con identidad institucional UDLA.</p>
        </div>
      </header>

      {/* ── Configuración ── */}
      <div className="impadm__config">
        <div className="impadm__config-section">
          <span className="impadm__config-label">
            <PictureAsPdfOutlinedIcon fontSize="small" /> Tipo de reporte
          </span>
          <div className="impadm__entidad-btns">
            {ENTIDADES.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`impadm__entidad-btn${entidad === key ? ' impadm__entidad-btn--active' : ''}`}
                onClick={() => setEntidad(key)}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="impadm__config-section">
          <span className="impadm__config-label">
            <CalendarTodayOutlinedIcon fontSize="small" /> Rango de fechas
          </span>
          <div className="impadm__date-row">
            <label className="impadm__date-group">
              <span>Desde</span>
              <input
                type="date"
                className="impadm__date-input"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
              />
            </label>
            <label className="impadm__date-group">
              <span>Hasta</span>
              <input
                type="date"
                className="impadm__date-input"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
              />
            </label>
          </div>
        </div>

        {entidad === 'incidentes' && (
          <div className="impadm__config-section">
            <span className="impadm__config-label">
              <FilterListIcon fontSize="small" /> Filtros adicionales
            </span>
            <div className="impadm__extra-filters">
              <label className="impadm__filter-label">
                <span>Estado</span>
                <select
                  className="impadm__select"
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="reportado">Reportado</option>
                  <option value="analisis">En análisis</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </label>
              <label className="impadm__filter-label">
                <span>Tipo</span>
                <select
                  className="impadm__select"
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos los tipos</option>
                  {Object.entries(TIPO_META).map(([k, m]) => (
                    <option key={k} value={k}>{m.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="impadm__config-summary">
          <span>
            <strong>{datos.length}</strong>{' '}
            {entidad === 'incidentes' ? 'incidente' : 'usuario'}{datos.length !== 1 ? 's' : ''} listos para imprimir
          </span>
          <button
            className="impadm__print-btn"
            onClick={handlePrint}
            disabled={datos.length === 0 || loading}
          >
            <PrintOutlinedIcon fontSize="small" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* ══ ÁREA IMPRIMIBLE ══ */}
      <div className="impadm__printable" ref={printRef}>

        {/* Cabecera institucional */}
        <div className="impadm__print-header">
          <div className="impadm__print-brand">
            <div className="impadm__print-logo-text">UDLA</div>
            <div className="impadm__print-brand-info">
              <strong>Universidad de la Amazonia</strong>
              <span>Sistema de Gestión de Incidentes — ReportaUdla</span>
            </div>
          </div>
          <div className="impadm__print-stripe" />
          <div className="impadm__print-meta">
            <p><strong>{entidad === 'incidentes' ? 'Reporte de Incidentes' : 'Listado de Usuarios'}</strong></p>
            <p>Periodo: {rangoLabel}</p>
            <p>Total registros: {datos.length}</p>
            <p>Generado: {genDate}</p>
          </div>
        </div>

        {/* Vista previa — incidentes */}
        {entidad === 'incidentes' && (
          <div className="impadm__preview">
            <div className="impadm__preview-header">
              <strong>Vista previa del reporte</strong>
              <span>{incidentesFiltrados.length} incidentes · {rangoLabel}</span>
            </div>

            {loading ? (
              <p className="impadm__loading">Cargando datos…</p>
            ) : incidentesFiltrados.length === 0 ? (
              <p className="impadm__no-data">No hay incidentes en el periodo y filtros seleccionados.</p>
            ) : (
              <div className="impadm__table-wrap">
                <table className="impadm__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Ubicación</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentesFiltrados.map((inc, idx) => {
                      const tipo  = TIPO_META[inc.tipo]
                      const eNorm = normalizeState(inc.estado)
                      const eMeta = ESTADO_META[eNorm]
                      return (
                        <tr key={inc.id}>
                          <td className="impadm__td-num">{idx + 1}</td>
                          <td>
                            <span className="impadm__tipo-cell" style={{ color: tipo?.color }}>
                              {tipo?.label ?? inc.tipo}
                            </span>
                          </td>
                          <td className="impadm__td-desc">{inc.descripcion?.slice(0, 70) ?? '—'}</td>
                          <td>{inc.ubicacionTextual ?? '—'}</td>
                          <td className="impadm__td-fecha">{fmtShort(inc.createdAt ?? inc.fecha)}</td>
                          <td>
                            <span
                              className="impadm__estado-badge"
                              style={{ color: eMeta?.color, borderColor: eMeta?.color }}
                            >
                              {eMeta?.label ?? eNorm}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vista previa — usuarios */}
        {entidad === 'usuarios' && (
          <div className="impadm__preview">
            <div className="impadm__preview-header">
              <strong>Vista previa del reporte</strong>
              <span>{usuariosFiltrados.length} usuarios registrados · {rangoLabel}</span>
            </div>

            {loading ? (
              <p className="impadm__loading">Cargando datos…</p>
            ) : usuariosFiltrados.length === 0 ? (
              <p className="impadm__no-data">No hay usuarios registrados en el periodo seleccionado.</p>
            ) : (
              <div className="impadm__table-wrap">
                <table className="impadm__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u, idx) => (
                      <tr key={u.uid}>
                        <td className="impadm__td-num">{idx + 1}</td>
                        <td><strong>{u.nombre || '(Sin nombre)'}</strong></td>
                        <td>{u.email || '—'}</td>
                        <td>
                          <span className={`impadm__rol-badge impadm__rol-badge--${u.rol}`}>
                            {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                          </span>
                        </td>
                        <td className="impadm__td-fecha">{fmtShort(u.creadoEn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer institucional */}
        <div className="impadm__print-footer">
          <span>Universidad de la Amazonia — ReportaUdla</span>
          <span>Documento generado el {genDate}</span>
          <span>Confidencial — Uso interno</span>
        </div>
      </div>

    </div>
  )
}

export default ImprimirAdmin
