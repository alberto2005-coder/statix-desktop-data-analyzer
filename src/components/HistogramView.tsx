import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { SlidersHorizontal, Activity, Sparkles } from 'lucide-react';

interface HistogramViewProps {
  data: any[];
  columns: string[];
  selectedCol: string;
  onSelectCol: (col: string) => void;
  bins: number;
  onChangeBins: (bins: number) => void;
  showNormalCurve: boolean;
  onToggleNormalCurve: (show: boolean) => void;
}

export const HistogramView: React.FC<HistogramViewProps> = ({
  data,
  columns,
  selectedCol,
  onSelectCol,
  bins,
  onChangeBins,
  showNormalCurve,
  onToggleNormalCurve
}) => {
  // Extract numeric columns
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data.some(d => d[col] !== null && d[col] !== '' && !isNaN(Number(d[col])))
    );
  }, [columns, data]);

  // Active numeric variable
  const activeCol = selectedCol && numericColumns.includes(selectedCol)
    ? selectedCol
    : numericColumns[0] || '';

  // Calculate histogram statistics and bins
  const { binData, stats } = useMemo(() => {
    if (!activeCol || data.length === 0) {
      return { binData: [], stats: null };
    }

    const values = data
      .map(d => parseFloat(d[activeCol]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return { binData: [], stats: null };
    }

    const n = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
    const stdDev = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const midIdx = Math.floor(n / 2);
    const median = n % 2 !== 0 ? sorted[midIdx] : (sorted[midIdx - 1] + sorted[midIdx]) / 2;

    // Skewness approximation (Pearson mode skewness)
    const skewness = stdDev > 0 ? (3 * (mean - median)) / stdDev : 0;

    const binCount = Math.max(3, Math.min(60, bins));
    const binWidth = range === 0 ? 1 : range / binCount;

    // Create bins
    const binsArr = Array.from({ length: binCount }, (_, i) => {
      const bMin = min + i * binWidth;
      const bMax = i === binCount - 1 ? max : min + (i + 1) * binWidth;
      const mid = (bMin + bMax) / 2;
      return {
        binIndex: i,
        binMin: bMin,
        binMax: bMax,
        mid,
        label: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
        count: 0,
        percent: 0,
        normalDensity: 0
      };
    });

    // Populate bin counts
    values.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      binsArr[idx].count++;
    });

    // Calculate normal curve density & relative percentages
    binsArr.forEach(b => {
      b.percent = Number(((b.count / n) * 100).toFixed(1));
      if (stdDev > 0 && range > 0) {
        // Gaussian PDF formula: f(x) = (1 / (sigma * sqrt(2pi))) * exp(-0.5 * ((x-mu)/sigma)^2)
        const z = (b.mid - mean) / stdDev;
        const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
        // Expected count in interval [bMin, bMax] ~ pdf * n * binWidth
        b.normalDensity = Number((pdf * n * binWidth).toFixed(2));
      } else {
        b.normalDensity = 0;
      }
    });

    return {
      binData: binsArr,
      stats: {
        n,
        min,
        max,
        range,
        mean,
        median,
        stdDev,
        skewness,
        binWidth,
        binCount
      }
    };
  }, [data, activeCol, bins]);

  // Sturges formula preset: k = ceil(log2(n) + 1)
  const applySturges = () => {
    if (!stats) return;
    const k = Math.ceil(Math.log2(stats.n) + 1);
    onChangeBins(Math.max(3, Math.min(60, k)));
  };

  // Scott formula preset: h = 3.49 * s / n^(1/3), k = ceil(range / h)
  const applyScott = () => {
    if (!stats || stats.stdDev === 0 || stats.range === 0) return;
    const h = (3.49 * stats.stdDev) / Math.cbrt(stats.n);
    const k = Math.ceil(stats.range / h);
    onChangeBins(Math.max(3, Math.min(60, k)));
  };

  if (numericColumns.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No se encontraron variables numéricas en el dataset para generar el histograma.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Variable Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Variable Numérica
          </label>
          <select
            value={activeCol}
            onChange={(e) => onSelectCol(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'white',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              minWidth: '180px'
            }}
          >
            {numericColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Bins Slider and Input */}
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SlidersHorizontal size={14} /> Intervalos (*Bins*): <strong style={{ color: 'var(--accent-color)' }}>{bins}</strong>
            </span>
            {stats && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Ancho (Δ): <strong style={{ color: '#f8fafc' }}>{stats.binWidth.toFixed(2)}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min="3"
              max="50"
              value={bins}
              onChange={(e) => onChangeBins(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--accent-color)',
                cursor: 'pointer'
              }}
            />
            <input
              type="number"
              min="3"
              max="50"
              value={bins}
              onChange={(e) => onChangeBins(Math.max(3, Math.min(50, Number(e.target.value))))}
              style={{
                width: '60px',
                background: 'var(--bg-secondary)',
                color: 'white',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Presets and Options */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={applySturges}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title="Ajustar según regla de Sturges: 1 + log2(N)"
          >
            <Sparkles size={14} /> Sturges
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={applyScott}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title="Ajustar según regla de Scott (varianza y tamaño de muestra)"
          >
            Scott
          </button>
        </div>

        {/* Normal Curve Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: showNormalCurve ? '#f59e0b' : 'var(--text-secondary)',
            userSelect: 'none'
          }}
        >
          <input
            type="checkbox"
            checked={showNormalCurve}
            onChange={(e) => onToggleNormalCurve(e.target.checked)}
            style={{ accentColor: '#f59e0b', width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <Activity size={16} /> Campana de Gauss (Normal)
        </label>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '380px', width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={binData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="histBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
              angle={bins > 18 ? -25 : 0}
              textAnchor={bins > 18 ? 'end' : 'middle'}
              height={bins > 18 ? 45 : 30}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              label={{
                value: 'Frecuencia (Conteo)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                style: { textAnchor: 'middle' }
              }}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const bin = payload[0].payload;
                return (
                  <div
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Intervalo: [{bin.binMin.toFixed(2)} - {bin.binMax.toFixed(2)}]
                    </div>
                    <div style={{ color: '#f8fafc', margin: '2px 0' }}>
                      Frecuencia: <strong>{bin.count}</strong> registros
                    </div>
                    <div style={{ color: '#94a3b8', margin: '2px 0' }}>
                      Porcentaje: <strong>{bin.percent}%</strong>
                    </div>
                    {showNormalCurve && (
                      <div style={{ color: '#f59e0b', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #334155' }}>
                        Curva Gaussiana Esperada: <strong>{bin.normalDensity}</strong>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              name={`Frecuencia de ${activeCol}`}
              dataKey="count"
              fill="url(#histBarGradient)"
              radius={[4, 4, 0, 0]}
              barSize={undefined}
            />
            {showNormalCurve && (
              <Line
                name="Distribución Normal (Gauss)"
                type="monotone"
                dataKey="normalDensity"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Statistical Summary Pills */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Muestra (N)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{stats.n}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Media (μ)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-color)' }}>{stats.mean.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mediana</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-color)' }}>{stats.median.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desv. Estándar (σ)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{stats.stdDev.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rango [Mín - Máx]</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
              [{stats.min.toFixed(1)}, {stats.max.toFixed(1)}]
            </div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asimetría (Skewness)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: Math.abs(stats.skewness) < 0.5 ? '#10b981' : '#ec4899' }}>
              {stats.skewness.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
