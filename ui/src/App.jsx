import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Thermometer, 
  Clock,
  Calendar,
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
    
    // Fetch logs initially and then more slowly
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

  const renderDashboard = () => (
    <>
      <header>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas actuales de {metrics?.hostname}</p>
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
          <div className="card-value" style={{ fontSize: '1.5rem' }}>
            {Math.floor(metrics?.uptime / 3600)}h {Math.floor((metrics?.uptime % 3600) / 60)}m
          </div>
          <p className="card-subtitle">Encendido: {new Date(metrics?.timestamp * 1000).toLocaleDateString()}</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Temperaturas</span>
            <Thermometer className="card-icon" size={18} />
          </div>
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {metrics?.temperatures.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t.label}</span>
                <span>{t.temperature.toFixed(0)}°C</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monitor de Red</span>
            <Network className="card-icon" size={18} />
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
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
                  <td style={{ fontWeight: 600 }}>{net.interface}</td>
                  <td>{net.tx_packets}</td>
                  <td>{net.rx_packets}</td>
                  <td style={{ color: (net.tx_errors + net.rx_errors) > 0 ? 'var(--danger)' : 'inherit' }}>{net.tx_errors + net.rx_errors}</td>
                  <td>{net.collisions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Estado Discos</span>
            <HardDrive className="card-icon" size={18} />
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th>Disco</th>
                <th>Uso</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.storage.slice(0, 4).map((disk, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: '80px', overflow: 'hidden' }}>{disk.name}</td>
                  <td>{formatBytes(disk.used_space)}</td>
                  <td>{formatBytes(disk.total_space)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <span className={`service-status ${service.is_active ? 'status-active' : 'status-inactive'}`}>
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
          <p style={{ color: 'var(--text-muted)' }}>Eventos persistentes en sqlite:monitor.db</p>
        </div>
        <button 
          onClick={fetchLogs}
          style={{ 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--accent-primary)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem'
          }}
        >
          <RefreshCcw size={14} /> Refrescar
        </button>
      </header>
      
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Historial de Eventos</span>
          <ListFilter size={16} color="var(--text-muted)" />
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>SISTEMA</th>
                <th style={{ padding: '1rem' }}>MENSAJE</th>
                <th style={{ padding: '1rem' }}>FECHA / HORA</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{log.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      background: log.level === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: log.level === 'error' ? 'var(--danger)' : 'var(--accent-primary)'
                    }}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{log.message}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.timestamp}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
      {/* Sidebar navigation */}
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

      {/* Main viewport */}
      <main className="main-content">
        {activeTab === 'dashboard' ? renderDashboard() : renderLogs()}
      </main>
    </div>
  );
}

export default App;
