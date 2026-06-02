import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../FireBase/config'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import './EstadisticasAdmin.css'

const STATE_ALIAS = { abierto: 'reportado', en_proceso: 'analisis', cerrado: 'resuelto' }
const normalizeState = (s) => STATE_ALIAS[s] || s || 'reportado'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,              color: '#EDB02E' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />, color: '#005A7E' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,           color: '#169586' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,          color: '#E81312' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,       color: '#8fa08e' },
}

const PERIODOS = [
  { key: 'semana',        label: 'Esta semana' },
  { key: 'mes_actual',   label: 'Este mes' },
  { key: 'mes_anterior', label: 'Mes anterior' },
  { key: 'total',        label: 'Todo el tiempo' },
  { key: 'personalizado', label: 'Personalizado' },
]

const getStartOfPeriod = (key) => {
  const now = new Date()
  if (key === 'semana') {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d
  }
  if (key === 'mes_actual') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (key === 'mes_anterior') {
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return new Date(y, m, 1)
  }
  return null
}

const getEndOfPeriod = (key) => {
  const now = new Date()
  if (key === 'mes_anterior') {
    return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  }
  return now
}

const fmt = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const BarChart = ({ items, max }) => (
  <div className="estadm__chart">
    {items.map(({ label, count, color, icon }) => (
      <div key={label} className="estadm__bar-row">
        <div className="estadm__bar-label">
          {icon && <span className="estadm__bar-icon" style={{ color }}>{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="estadm__bar-track">
          <div
            className="estadm__bar-fill"
            style={{
              width: max > 0 ? `${(count / max) * 100}%` : '0%',
              background: color,
            }}
          />
        </div>
        <span className="estadm__bar-count">{count}</span>
      </div>
    ))}
  </div>
)

const EstadisticasAdmin = () => {
  const [all, setAll]             = useState([])
  const [loading, setLoading]     = useState(true)
  const [periodo, setPeriodo]     = useState('mes_actual')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin]       = useState('')
  const printRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'incidente'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    if (periodo === 'total') return all
    if (periodo === 'personalizado') {
      if (!fechaInicio || !fechaFin) return all
      const start = new Date(fechaInicio)
      const end   = new Date(fechaFin); end.setHours(23, 59, 59)
      return all.filter(i => {
        const d = new Date(i.createdAt ?? i.fecha)
        return d >= start && d <= end
      })
    }
    const start = getStartOfPeriod(periodo)
    const end   = getEndOfPeriod(periodo)
    return all.filter(i => {
      const d = new Date(i.createdAt ?? i.fecha)
      return d >= start && d <= end
    })
  }, [all, periodo, fechaInicio, fechaFin])

  const stats = useMemo(() => {
    const byEstado = { reportado: 0, analisis: 0, resuelto: 0 }
    const byTipo   = Object.fromEntries(Object.keys(TIPO_META).map(k => [k, 0]))

    filtered.forEach(i => {
      const e = normalizeState(i.estado)
      if (byEstado[e] !== undefined) byEstado[e]++
      if (byTipo[i.tipo] !== undefined) byTipo[i.tipo]++
      else byTipo.otro++
    })

    return { total: filtered.length, byEstado, byTipo }
  }, [filtered])

  const estadoItems = [
    { label: 'Reportado',   count: stats.byEstado.reportado, color: '#EDB02E', icon: <ReportOutlinedIcon fontSize="small" /> },
    { label: 'En análisis', count: stats.byEstado.analisis,  color: '#005A7E', icon: <HourglassEmptyIcon fontSize="small" /> },
    { label: 'Resuelto',    count: stats.byEstado.resuelto,  color: '#0B750E', icon: <CheckCircleOutlinedIcon fontSize="small" /> },
  ]

  const tipoItems = Object.entries(TIPO_META).map(([key, meta]) => ({
    label: meta.label,
    count: stats.byTipo[key] ?? 0,
    color: meta.color,
    icon: meta.icon,
  }))

  const maxEstado = Math.max(...estadoItems.map(i => i.count), 1)
  const maxTipo   = Math.max(...tipoItems.map(i => i.count), 1)

  const etiquetaPeriodo = PERIODOS.find(p => p.key === periodo)?.label ?? periodo

  const handlePrint = () => window.print()

  const periodoLabel = (() => {
    if (periodo === 'personalizado' && fechaInicio && fechaFin) {
      return `Del ${fmt(fechaInicio)} al ${fmt(fechaFin)}`
    }
    return etiquetaPeriodo
  })()

  if (loading) {
    return (
      <div className="estadm">
        <div className="estadm__skeleton-header" />
        <div className="estadm__skeleton-cards" />
      </div>
    )
  }

  return (
    <div className="estadm">

      {/* ── Encabezado ── */}
      <header className="estadm__header">
        <div className="estadm__header-text">
          <span className="estadm__eyebrow">Panel administrativo</span>
          <h1 className="estadm__title">Estadísticas</h1>
          <p className="estadm__subtitle">Métricas de incidentes por periodo de tiempo.</p>
        </div>
        <button className="estadm__print-btn" onClick={handlePrint} title="Imprimir estadísticas">
          <PrintOutlinedIcon fontSize="small" />
          Imprimir
        </button>
      </header>

      {/* ── Selector de periodo ── */}
      <div className="estadm__periodo-bar">
        {PERIODOS.map(({ key, label }) => (
          <button
            key={key}
            className={`estadm__periodo-btn${periodo === key ? ' estadm__periodo-btn--active' : ''}`}
            onClick={() => setPeriodo(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="estadm__date-row">
          <label className="estadm__date-group">
            <span>Desde</span>
            <input
              type="date"
              className="estadm__date-input"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </label>
          <label className="estadm__date-group">
            <span>Hasta</span>
            <input
              type="date"
              className="estadm__date-input"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* ── Área imprimible ── */}
      <div className="estadm__printable" ref={printRef}>

        {/* Cabecera de impresión */}
        <div className="estadm__print-header">
          <div className="estadm__print-logo">
            <strong>UDLA</strong>
            <div>
              <p>Universidad de la Amazonia</p>
              <small>Sistema de Gestión de Incidentes — ReportaUdla</small>
            </div>
          </div>
          <div className="estadm__print-meta">
            <p><strong>Reporte:</strong> Estadísticas de Incidentes</p>
            <p><strong>Periodo:</strong> {periodoLabel}</p>
            <p><strong>Generado:</strong> {fmt(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="estadm__cards">
          <div className="estadm__card estadm__card--total">
            <div className="estadm__card-icon">
              <TrendingUpIcon />
            </div>
            <div className="estadm__card-body">
              <span className="estadm__card-num">{stats.total}</span>
              <span className="estadm__card-label">Total de incidentes</span>
              <span className="estadm__card-periodo">{periodoLabel}</span>
            </div>
          </div>

          <div className="estadm__card estadm__card--reportado">
            <div className="estadm__card-icon"><ReportOutlinedIcon /></div>
            <div className="estadm__card-body">
              <span className="estadm__card-num">{stats.byEstado.reportado}</span>
              <span className="estadm__card-label">Reportados</span>
              <span className="estadm__card-pct">
                {stats.total > 0 ? Math.round((stats.byEstado.reportado / stats.total) * 100) : 0}% del total
              </span>
            </div>
          </div>

          <div className="estadm__card estadm__card--analisis">
            <div className="estadm__card-icon"><HourglassEmptyIcon /></div>
            <div className="estadm__card-body">
              <span className="estadm__card-num">{stats.byEstado.analisis}</span>
              <span className="estadm__card-label">En análisis</span>
              <span className="estadm__card-pct">
                {stats.total > 0 ? Math.round((stats.byEstado.analisis / stats.total) * 100) : 0}% del total
              </span>
            </div>
          </div>

          <div className="estadm__card estadm__card--resuelto">
            <div className="estadm__card-icon"><CheckCircleOutlinedIcon /></div>
            <div className="estadm__card-body">
              <span className="estadm__card-num">{stats.byEstado.resuelto}</span>
              <span className="estadm__card-label">Resueltos</span>
              <span className="estadm__card-pct">
                {stats.total > 0 ? Math.round((stats.byEstado.resuelto / stats.total) * 100) : 0}% del total
              </span>
            </div>
          </div>
        </div>

        {/* Gráficas */}
        {stats.total === 0 ? (
          <div className="estadm__empty">
            <BarChartOutlinedIcon sx={{ fontSize: 48 }} />
            <p>No hay incidentes en el periodo seleccionado.</p>
          </div>
        ) : (
          <div className="estadm__charts-grid">
            <div className="estadm__chart-card">
              <div className="estadm__chart-header">
                <BarChartOutlinedIcon fontSize="small" />
                <strong>Incidentes por estado</strong>
              </div>
              <BarChart items={estadoItems} max={maxEstado} />
            </div>

            <div className="estadm__chart-card">
              <div className="estadm__chart-header">
                <BarChartOutlinedIcon fontSize="small" />
                <strong>Incidentes por tipo</strong>
              </div>
              <BarChart items={tipoItems} max={maxTipo} />
            </div>
          </div>
        )}

        {/* Tabla detallada de tipos */}
        {stats.total > 0 && (
          <div className="estadm__detail-table">
            <div className="estadm__chart-header">
              <BarChartOutlinedIcon fontSize="small" />
              <strong>Detalle por tipo de incidente</strong>
            </div>
            <table className="estadm__table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Total</th>
                  <th>Reportados</th>
                  <th>En análisis</th>
                  <th>Resueltos</th>
                  <th>% Resolución</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(TIPO_META).map(([key, meta]) => {
                  const incsTipo = filtered.filter(i => i.tipo === key)
                  const total    = incsTipo.length
                  const rep      = incsTipo.filter(i => normalizeState(i.estado) === 'reportado').length
                  const ana      = incsTipo.filter(i => normalizeState(i.estado) === 'analisis').length
                  const res      = incsTipo.filter(i => normalizeState(i.estado) === 'resuelto').length
                  const pct      = total > 0 ? Math.round((res / total) * 100) : 0
                  if (total === 0) return null
                  return (
                    <tr key={key}>
                      <td>
                        <span className="estadm__table-tipo" style={{ color: meta.color }}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td><strong>{total}</strong></td>
                      <td>{rep}</td>
                      <td>{ana}</td>
                      <td>{res}</td>
                      <td>
                        <span className={`estadm__pct-badge${pct === 100 ? ' estadm__pct-badge--full' : ''}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de impresión */}
        <div className="estadm__print-footer">
          <span>ReportaUdla — Universidad de la Amazonia</span>
          <span>Generado el {fmt(new Date().toISOString())}</span>
        </div>
      </div>
    </div>
  )
}

export default EstadisticasAdmin
