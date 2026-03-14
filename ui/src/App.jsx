import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Thermometer, 
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

function App() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/metrics');
      if (!response.ok) throw new Error('API disconnected');
      const data = await response.json();
      
      if (!data) return;

      setMetrics(data);
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setHistory(prev => {
        const newPoint = { 
          time: timeStr, 
          cpu: parseFloat(data.cpu_usage.toFixed(1)) 
        };
        const updated = [...prev, newPoint].slice(-15);
        return updated;
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Backend connection lost. Retrying...');
      // Keep previous metrics if possible to avoid flickering, but show error
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatRuntime = (seconds) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  if (loading && !metrics) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity className="pulse" size={48} color="var(--accent-primary)" />
          <h2 style={{ marginTop: '1rem' }}>Iniciando ServerMonitor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header>
        <div>
          <h1>ServerMonitor</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Hostname: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{metrics?.hostname}</span>
          </p>
        </div>
        <div className="status-badge">
          <div className={`status-indicator ${error ? 'pulse' : ''}`} style={{ background: error ? 'var(--danger)' : 'var(--success)' }}></div>
          {error || 'Sistema en Línea'}
        </div>
      </header>

      {/* Main Stats Row */}
      <div className="metrics-grid">
        {/* CPU Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Carga de CPU</span>
            <Cpu className="card-icon" size={20} />
          </div>
          <div className="card-value">{metrics?.cpu_usage.toFixed(1)}%</div>
          <div style={{ height: '80px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="var(--accent-primary)" 
                  fillOpacity={1} 
                  fill="url(#colorCpu)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime/Run Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tiempo de Encendido (run_t)</span>
            <Clock className="card-icon" size={20} />
          </div>
          <div className="card-value" style={{ fontSize: '1.75rem' }}>{formatRuntime(metrics?.uptime)}</div>
          <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Calendar size={14} /> {formatDate(metrics?.timestamp)}
          </div>
        </div>

        {/* Temperature Card - Dynamic */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Temperaturas (Sensor/Core)</span>
            <Thermometer className="card-icon" size={20} />
          </div>
          <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '5px' }}>
            {metrics?.temperatures.length > 0 ? metrics.temperatures.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t.label}</span>
                <span style={{ fontWeight: 600, color: t.temperature > 70 ? 'var(--danger)' : 'var(--text-main)' }}>
                  {t.temperature.toFixed(1)}°C
                </span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)' }}>No se detectaron sensores</p>}
          </div>
        </div>
      </div>

      {/* Network and Storage Section */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
        
        {/* Network Detailed Counters */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Contadores de Red</span>
            <Network className="card-icon" size={20} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ paddingBottom: '0.8rem' }}>Interfaz</th>
                  <th style={{ paddingBottom: '0.8rem' }}>TX (Env)</th>
                  <th style={{ paddingBottom: '0.8rem' }}>RX (Rec)</th>
                  <th style={{ paddingBottom: '0.8rem' }}>TX Err</th>
                  <th style={{ paddingBottom: '0.8rem' }}>RX Err</th>
                  <th style={{ paddingBottom: '0.8rem' }}>Collis</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.network.map((net, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>{net.interface}</td>
                    <td style={{ padding: '0.6rem 0' }}>{net.tx_packets.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0' }}>{net.rx_packets.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0', color: net.tx_errors > 0 ? 'var(--danger)' : 'inherit' }}>{net.tx_errors}</td>
                    <td style={{ padding: '0.6rem 0', color: net.rx_errors > 0 ? 'var(--danger)' : 'inherit' }}>{net.rx_errors}</td>
                    <td style={{ padding: '0.6rem 0' }}>{net.collisions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Storage */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Almacenamiento (Storage)</span>
            <HardDrive className="card-icon" size={20} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ paddingBottom: '0.8rem' }}>Nombre</th>
                  <th style={{ paddingBottom: '0.8rem' }}>Montaje</th>
                  <th style={{ paddingBottom: '0.8rem' }}>Used</th>
                  <th style={{ paddingBottom: '0.8rem' }}>Total</th>
                  <th style={{ paddingBottom: '0.8rem' }}>Libre</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.storage.map((disk, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{disk.name}</td>
                    <td style={{ padding: '0.6rem 0' }}>{disk.mount_point}</td>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>{formatBytes(disk.used_space)}</td>
                    <td style={{ padding: '0.6rem 0' }}>{formatBytes(disk.total_space)}</td>
                    <td style={{ padding: '0.6rem 0' }}>{formatBytes(disk.available_space)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Services Footer */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Estado de Servicios y Demonios</span>
          <Activity className="card-icon" size={20} />
        </div>
        <div className="services-grid">
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
      
      <footer style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        ServerMonitor v0.1 | Actualizado cada 3 segundos | Timestamp: {metrics?.timestamp}
      </footer>
    </div>
  );
}

export default App;
