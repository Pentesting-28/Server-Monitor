import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Thermometer, 
  Clock,
  LayoutDashboard,
  FileText,
  Server,
  ChevronRight,
  RefreshCcw,
  ListFilter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer
} from 'recharts';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/metrics');
      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      
      setMetrics(data);
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory(prev => {
        const newPoint = { time: timeStr, cpu: parseFloat(data.cpu_usage.toFixed(1)) };
        return [...prev, newPoint].slice(-15);
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/logs');
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const metricsInterval = setInterval(fetchMetrics, 3000);
    
    fetchLogs();
    const logsInterval = setInterval(fetchLogs, 10000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLogLevelBadge = (level) => {
    const l = level.toLowerCase();
    if (l === 'error') return 'badge badge-danger';
    if (l === 'warn') return 'badge badge-warning';
    if (l === 'info') return 'badge badge-info';
    return 'badge badge-primary';
  };

  const renderDashboard = () => (
    <>
      <header>
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Métricas actuales de {metrics?.hostname}</p>
        </div>
        <div className="status-badge">
          <div className={`status-indicator ${error ? 'pulse' : ''}`} style={{ background: error ? 'var(--danger)' : 'var(--success)' }}></div>
          {error || 'Sistema Estable'}
        </div>
      </header>

      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Carga de CPU</span>
            <Cpu className="card-icon" size={18} />
          </div>
          <div className="card-value">{metrics?.cpu_usage.toFixed(1)}%</div>
          <div style={{ height: '70px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="cpu" stroke="var(--accent-primary)" fill="url(#colorCpu)" isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">RunTime (up)</span>
            <Clock className="card-icon" size={18} />
          </div>
          <div className="card-value text-xl">
            {Math.floor(metrics?.uptime / 3600)}h {Math.floor((metrics?.uptime % 3600) / 60)}m
          </div>
          <p className="card-subtitle">Encendido: {new Date(metrics?.timestamp * 1000).toLocaleDateString()}</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Temperaturas</span>
            <Thermometer className="card-icon" size={18} />
          </div>
          <div className="kv-list">
            {metrics?.temperatures.map((t, i) => (
              <div key={i} className="kv-item">
                <span className="kv-key">{t.label}</span>
                <span className="kv-value">{t.temperature.toFixed(0)}°C</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div className="card no-padding">
          <div className="card-inner-header">
            <span className="card-title">Monitor de Red</span>
            <Network className="card-icon" size={18} />
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>INT</th>
                  <th>TX (Pkt)</th>
                  <th>RX (Pkt)</th>
                  <th>ERR</th>
                  <th>COLL</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.network.map((net, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{net.interface}</td>
                    <td>{net.tx_packets}</td>
                    <td>{net.rx_packets}</td>
                    <td className={(net.tx_errors + net.rx_errors) > 0 ? 'text-danger' : ''}>
                      {net.tx_errors + net.rx_errors}
                    </td>
                    <td>{net.collisions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card no-padding">
          <div className="card-inner-header">
            <span className="card-title">Estado Discos</span>
            <HardDrive className="card-icon" size={18} />
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Disco</th>
                  <th>Uso</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.storage.slice(0, 4).map((disk, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{disk.name}</td>
                    <td>{formatBytes(disk.used_space)}</td>
                    <td>{formatBytes(disk.total_space)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Servicios Principales</span>
          <Activity className="card-icon" size={18} />
        </div>
        <div className="services-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {metrics?.services.map(service => (
            <div key={service.name} className="service-item">
              <span className="service-name">{service.name}</span>
              <span className={`badge ${service.is_active ? 'badge-success' : 'badge-danger'}`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderLogs = () => (
    <>
      <header>
        <div>
          <h1>Logs del Sistema</h1>
          <p className="text-muted">Eventos persistentes en sqlite:monitor.db</p>
        </div>
        <button onClick={fetchLogs} className="btn">
          <RefreshCcw size={14} /> Refrescar
        </button>
      </header>
      
      <div className="card no-padding">
        <div className="card-inner-header">
          <span className="card-title">Historial de Eventos</span>
          <ListFilter size={16} className="text-muted" />
        </div>
        
        <div className="data-table-container">
          <table className="data-table bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>SISTEMA</th>
                <th>MENSAJE</th>
                <th>FECHA / HORA</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted">#{log.id}</td>
                  <td>
                    <span className={getLogLevelBadge(log.level)}>
                      {log.level}
                    </span>
                  </td>
                  <td className="font-semibold">{log.message}</td>
                  <td className="text-muted text-sm">{log.timestamp}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">
                    No hay logs registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Server color="var(--accent-primary)" size={24} />
          <span>ServerMonitor</span>
        </div>
        
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
            {activeTab === 'dashboard' && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <FileText size={20} />
            <span>Logs</span>
            {activeTab === 'logs' && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' ? renderDashboard() : renderLogs()}
      </main>
    </div>
  );
}

export default App;
