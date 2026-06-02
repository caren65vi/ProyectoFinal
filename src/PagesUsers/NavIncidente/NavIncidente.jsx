import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db } from '../../FireBase/config'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import SearchIcon from '@mui/icons-material/Search'
import BoltIcon from '@mui/icons-material/Bolt'
import OpacityIcon from '@mui/icons-material/Opacity'
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'
import SecurityIcon from '@mui/icons-material/Security'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { useNavigate } from 'react-router-dom'
import DetailsIncidents from '../../Components/DetailsIncidents/DetailsIncidents'
import './NavIncidente.css'

const TIPO_META = {
  electrico:       { label: 'Eléctrico',      icon: <BoltIcon />,               cls: 'tipoElectrico' },
  infraestructura: { label: 'Infraestructura', icon: <HomeRepairServiceIcon />,   cls: 'tipoInfraestructura' },
  plomeria:        { label: 'Plomería',        icon: <OpacityIcon />,             cls: 'tipoPlomeria' },
  seguridad:       { label: 'Seguridad',       icon: <SecurityIcon />,            cls: 'tipoSeguridad' },
  otro:            { label: 'Otro',            icon: <HelpOutlineIcon />,         cls: 'tipoOtro' },
}

const STATE_ALIAS = {
  abierto: 'reportado',
  en_proceso: 'analisis',
  cerrado: 'resuelto',
}

const normalizeState = (state) => STATE_ALIAS[state] || state

const ESTADO_META = {
  reportado: { label: 'Reportado', cls: 'estadoAbierto' },
  analisis:  { label: 'En análisis', cls: 'estadoProceso' },
  resuelto:  { label: 'Resuelto', cls: 'estadoCerrado' },
}

const FILTROS_ESTADO = [
  { key: 'todos',      label: 'Todos' },
  { key: 'reportado',  label: 'Reportado' },
  { key: 'analisis',   label: 'En análisis' },
  { key: 'resuelto',   label: 'Resuelto' },
]

const fmt = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const TipoIcon = ({ tipo }) => {
  const meta = TIPO_META[tipo]
  return (
    <span className={`navIncTipoIcon ${meta?.cls ?? 'tipoOtro'}`}>
      {meta?.icon ?? <HelpOutlineIcon />}
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
const NavIncidente = () => {
  const navigate = useNavigate()
  const [all, setAll]             = useState([])
  const [loading, setLoading]     = useState(() => Boolean(auth.currentUser?.uid))
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo]     = useState('todos')
  const [orden, setOrden]         = useState('reciente')
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'incidente'), orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q,
      (snap) => {
        setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError('')
      },
      (err) => { console.error('[NavIncidente]', err); setError('No se pudieron cargar los incidentes.'); setLoading(false) },
    )
    return unsub
  }, [])

  const filtered = useMemo(() => {
    let list = [...all]
    if (filtroEstado !== 'todos') list = list.filter(i => normalizeState(i.estado) === filtroEstado)
    if (filtroTipo   !== 'todos') list = list.filter(i => i.tipo   === filtroTipo)
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(i =>
        i.descripcion?.toLowerCase().includes(s) ||
        i.ubicacionTextual?.toLowerCase().includes(s) ||
        TIPO_META[i.tipo]?.label?.toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const da = a.createdAt ?? '', db2 = b.createdAt ?? ''
      return orden === 'reciente' ? db2.localeCompare(da) : da.localeCompare(db2)
    })
    return list
  }, [all, filtroEstado, filtroTipo, search, orden])

  const counts = useMemo(() => ({
    todos: all.length,
    reportado: all.filter(i => normalizeState(i.estado) === 'reportado').length,
    analisis: all.filter(i => normalizeState(i.estado) === 'analisis').length,
    resuelto: all.filter(i => normalizeState(i.estado) === 'resuelto').length,
  }), [all])

  return (
    <div className="navInc">
      {/* Header */}
      <header className="navIncHeader">
        <div>
          <h1 className="navIncTitle">Incidentes</h1>
          <p className="navIncSubtitle">Gestiona y revisa todos los reportes</p>
        </div>
        <button className="navIncBtn" onClick={() => navigate('/dashboard/reportar')}>
          <AddCircleOutlineIcon fontSize="small" /> Nuevo reporte
        </button>
      </header>

      {/* Buscador + controles */}
      <div className="navIncControls">
        <div className="navIncSearch">
          <SearchIcon className="navIncSearchIcon" fontSize="small" />
          <input
            type="text"
            placeholder="Buscar incidente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="navIncSearchInput"
          />
        </div>
        <div className="navIncControlsRight">
          <span className="navIncControlLabel">Estado:</span>
          <div className="navIncFiltros">
            {FILTROS_ESTADO.map(({ key, label }) => (
              <button key={key}
                className={`navIncFiltroBtn${filtroEstado === key ? ' navIncFiltroBtnActive' : ''}`}
                onClick={() => setFiltroEstado(key)}>
                {label}
                <span className="navIncFiltroCount">{counts[key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tipo + Orden */}
      <div className="navIncSelects">
        <select className="navIncSelect" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos los tipos</option>
          {Object.entries(TIPO_META).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="navIncSelect" value={orden} onChange={e => setOrden(e.target.value)}>
          <option value="reciente">Más reciente</option>
          <option value="antiguo">Más antiguo</option>
        </select>
      </div>

      {error && <p className="navIncError" role="alert">{error}</p>}

      {/* Tabla */}
      <div className="navIncTableWrap">
        <div className="navIncTableHeader">
          <span className="navIncTableTitle">Listado de incidentes</span>
          <span className="navIncTableCount">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <ul className="navIncList">
            {[1,2,3].map(i => <li key={i} className="navIncCard navIncCardSkeleton" />)}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="navIncEmpty">
            <AddCircleOutlineIcon sx={{ fontSize: 40 }} />
            <p>No hay incidentes con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="navIncColHeaders">
              <span>Incidente</span>
              <span>Tipo</span>
              <span>Ubicación</span>
              <span>Fecha</span>
              <span>Estado / Acciones</span>
            </div>
            <ul className="navIncList">
              {filtered.map(inc => {
                const tipo  = TIPO_META[inc.tipo]  ?? { label: inc.tipo, cls: 'tipoOtro' }
                const normalizedEstado = normalizeState(inc.estado)
                const state = ESTADO_META[normalizedEstado] ?? { label: normalizedEstado, cls: 'estadoAbierto' }
                return (
                  <li key={inc.id} className={`navIncRow${selected?.id === inc.id ? ' navIncRowActive' : ''}`}>
                    <div className="navIncRowIncidente">
                      <TipoIcon tipo={inc.tipo} />
                      <div className="navIncRowInfo">
                        <strong>{tipo.label} — {inc.ubicacionTextual?.slice(0, 12) || '...'}</strong>
                        <span>{inc.descripcion?.slice(0, 30) ?? ''}...</span>
                      </div>
                    </div>
                    <span className={`navIncTipoBadge ${tipo.cls}`}>{tipo.label}</span>
                    <span className="navIncRowUbicacion">
                      <LocationOnOutlinedIcon fontSize="inherit" /> {inc.ubicacionTextual || '—'}
                    </span>
                    <span className="navIncRowFecha">{fmt(inc.createdAt ?? inc.fecha)}</span>
                    <div className="navIncRowActions">
                      <span className={`navIncEstadoBadge ${state.cls}`}>{state.label}</span>
                      <button
                        className="navIncVerBtn"
                        onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                        title="Ver detalle"
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Modal emergente de detalle */}
      {selected && <DetailsIncidents incident={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default NavIncidente
