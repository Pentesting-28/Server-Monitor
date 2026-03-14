import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Thermometer, 
  Clock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  YAxis 
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
      setMetrics(data);
      
      // Keep a small history for the chart (last 10 points)
      setHistory(prev => {
        const newPoint = { 
          time: new Date().toLocaleTimeString(), 
          cpu: data.cpu_usage.toFixed(1) 
        };
        const updated = [...prev, newPoint].slice(-10);
        return updated;
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Backend connection lost. Retrying...');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="dashboard-container"><h1>Cargando Monitor...</h1></div>;

  return (
    <div className="dashboard-container">
      <header>
        <div>
          <h1>ServerMonitor</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas en tiempo real para {metrics?.hostname || 'Kernel'}</p>
        </div>
        <div className="status-badge">
          <div className={`status-indicator ${error ? 'pulse' : ''}`} style={{ background: error ? 'var(--danger)' : 'var(--success)' }}></div>
          {error || 'Sistema Operativo'}
        </div>
      </header>

      <div className="metrics-grid">
        {/* CPU Usage Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Uso de CPU</span>
            <Cpu className="card-icon" size={20} />
          </div>
          <div className="card-value">{metrics?.cpu_usage.toFixed(1)}%</div>
          <div style={{ height: '60px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="var(--accent-primary)" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tiempo de Actividad</span>
            <Clock className="card-icon" size={20} />
          </div>
          <div className="card-value">{(metrics?.uptime / 3600).toFixed(1)}h</div>
          <div className="card-subtitle">Segundos totales: {metrics?.uptime}</div>
        </div>

        {/* Network Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Interfaces de Red</span>
            <Network className="card-icon" size={20} />
          </div>
          <div className="card-value">{metrics?.network.length}</div>
          <div className="card-subtitle">
            {metrics?.network[0]?.interface}: {metrics?.network[0]?.rx_packets} RX / {metrics?.network[0]?.tx_packets} TX
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Services Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Servicios Críticos</span>
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

        {/* Storage Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Almacenamiento</span>
            <HardDrive className="card-icon" size={20} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ paddingBottom: '1rem' }}>Montaje</th>
                  <th style={{ paddingBottom: '1rem' }}>Uso</th>
                  <th style={{ paddingBottom: '1rem' }}>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.storage.slice(0, 5).map((disk, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0' }}>{disk.mount_point}</td>
                    <td style={{ padding: '0.75rem 0' }}>{(disk.used_space / 1024 / 1024 / 1024).toFixed(1)} GB</td>
                    <td style={{ padding: '0.75rem 0' }}>{(disk.available_space / 1024 / 1024 / 1024).toFixed(1)} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
