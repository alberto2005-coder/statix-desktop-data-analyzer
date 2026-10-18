import React, { useMemo, useState } from 'react';
import { Layers, Eye, Sparkles } from 'lucide-react';

interface BoxplotViewProps {
  data: any[];
  columns: string[];
  numCol: string;
  groupCol: string;
  onSelectNumCol: (col: string) => void;
  onSelectGroupCol: (col: string) => void;
}

interface BoxplotStats {
  groupName: string;
  n: number;
  min: number;
  max: number;
  whiskerMin: number;
  q1: number;
  median: number;
  q3: number;
  whiskerMax: number;
  iqr: number;
  mean: number;
  stdDev: number;
  outliers: number[];
  allValues: number[];
}

const BOX_COLORS = [
  '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e'
];

export const BoxplotView: React.FC<BoxplotViewProps> = ({
  data,
  columns,
  numCol,
  groupCol,
  onSelectNumCol,
  onSelectGroupCol
}) => {
  const [showJitter, setShowJitter] = useState<boolean>(false);
  const [showOutliers, setShowOutliers] = useState<boolean>(true);
  const [hoveredBox, setHoveredBox] = useState<BoxplotStats | null>(null);

  // Extract numeric columns
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data.some(d => d[col] !== null && d[col] !== '' && !isNaN(Number(d[col])))
    );
  }, [columns, data]);

  // Active numeric variable
  const activeNumCol = numCol && numericColumns.includes(numCol)
    ? numCol
    : numericColumns[0] || '';

  // Boxplot statistics for each group
  const { groupsStats, globalMin, globalMax } = useMemo(() => {
    if (!activeNumCol || data.length === 0) {
      return { groupsStats: [], globalMin: 0, globalMax: 1 };
    }

    // Group values
    const groupsMap: Record<string, number[]> = {};

    data.forEach(row => {
      const rawVal = row[activeNumCol];
      if (rawVal === null || rawVal === undefined || rawVal === '' || isNaN(Number(rawVal))) {
        return;
      }
      const val = Number(rawVal);
      const groupKey = groupCol && row[groupCol] !== null && row[groupCol] !== undefined && row[groupCol] !== ''
        ? String(row[groupCol])
        : '(Todo el Dataset)';

      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = [];
      }
      groupsMap[groupKey].push(val);
    });

    const groupKeys = Object.keys(groupsMap);
    if (groupKeys.length === 0) {
      return { groupsStats: [], globalMin: 0, globalMax: 1 };
    }

    // Limit to max 12 groups to keep the chart legible
    const selectedGroupKeys = groupKeys.slice(0, 12);

    let gMin = Infinity;
    let gMax = -Infinity;

    const statsList: BoxplotStats[] = selectedGroupKeys.map(groupName => {
      const values = groupsMap[groupName].sort((a, b) => a - b);
      const n = values.length;

      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / (n || 1);
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
      const stdDev = Math.sqrt(variance);

      // Percentile function (interpolated)
      const getPercentile = (p: number) => {
        if (n === 1) return values[0];
        const index = (n - 1) * p;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return values[lower] * (1 - weight) + values[upper] * weight;
      };

      const q1 = getPercentile(0.25);
      const median = getPercentile(0.50);
      const q3 = getPercentile(0.75);
      const iqr = q3 - q1;

      // Tukey's rule for whiskers
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      // Whiskers extend to the most extreme data points within the fences
      const withinLower = values.filter(v => v >= lowerFence);
      const whiskerMin = withinLower.length > 0 ? withinLower[0] : values[0];

      const withinUpper = values.filter(v => v <= upperFence);
      const whiskerMax = withinUpper.length > 0 ? withinUpper[withinUpper.length - 1] : values[values.length - 1];

      // Outliers
      const outliers = values.filter(v => v < lowerFence || v > upperFence);

      const min = values[0];
      const max = values[values.length - 1];

      if (min < gMin) gMin = min;
      if (max > gMax) gMax = max;

      return {
        groupName,
        n,
        min,
        max,
        whiskerMin,
        q1,
        median,
        q3,
        whiskerMax,
        iqr,
        mean,
        stdDev,
        outliers,
        allValues: values
      };
    });

    // Add padding to range
    if (gMin === Infinity) {
      gMin = 0;
      gMax = 100;
    } else {
      const padding = (gMax - gMin) * 0.08 || 1;
      gMin -= padding;
      gMax += padding;
    }

    return { groupsStats: statsList, globalMin: gMin, globalMax: gMax };
  }, [data, activeNumCol, groupCol]);

  if (numericColumns.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No se encontraron variables numéricas para generar el Boxplot.
      </div>
    );
  }

  // SVG Drawing Dimensions
  const svgWidth = 800;
  const svgHeight = 400;
  const marginTop = 30;
  const marginBottom = 60;
  const marginLeft = 80;
  const marginRight = 30;

  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  // Coordinate scales
  const yScale = (val: number) => {
    if (globalMax === globalMin) return plotHeight / 2 + marginTop;
    return marginTop + plotHeight - ((val - globalMin) / (globalMax - globalMin)) * plotHeight;
  };

  // Y-axis ticks
  const yTicksCount = 6;
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    return globalMin + (i * (globalMax - globalMin)) / (yTicksCount - 1);
  });

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
        {/* Numerical Variable */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Variable Numérica (Eje Y)
          </label>
          <select
            value={activeNumCol}
            onChange={(e) => onSelectNumCol(e.target.value)}
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

        {/* Grouping Variable */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Agrupar por (Eje X / Opcional)
          </label>
          <select
            value={groupCol}
            onChange={(e) => onSelectGroupCol(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'white',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              minWidth: '200px'
            }}
          >
            <option value="">-- Sin Agrupar (Todo el Dataset) --</option>
            {columns.filter(c => c !== activeNumCol).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginLeft: 'auto' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: showOutliers ? '#ef4444' : 'var(--text-secondary)',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={showOutliers}
              onChange={(e) => setShowOutliers(e.target.checked)}
              style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <Eye size={16} /> Destacar Atípicos (Outliers)
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: showJitter ? 'var(--accent-color)' : 'var(--text-secondary)',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={showJitter}
              onChange={(e) => setShowJitter(e.target.checked)}
              style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <Layers size={16} /> Dispersión Jitter (Puntos)
          </label>
        </div>
      </div>

      {/* SVG Boxplot Canvas */}
      <div style={{ height: '420px', width: '100%', position: 'relative', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Grid lines and Y-axis ticks */}
          {yTicks.map((tickVal, i) => {
            const y = yScale(tickVal);
            return (
              <g key={i}>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={svgWidth - marginRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
                <text
                  x={marginLeft - 12}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="end"
                >
                  {tickVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Y Axis line */}
          <line
            x1={marginLeft}
            y1={marginTop}
            x2={marginLeft}
            y2={marginTop + plotHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* X Axis line */}
          <line
            x1={marginLeft}
            y1={marginTop + plotHeight}
            x2={svgWidth - marginRight}
            y2={marginTop + plotHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Y Axis Title */}
          <text
            x={20}
            y={marginTop + plotHeight / 2}
            fill="#94a3b8"
            fontSize="12"
            textAnchor="middle"
            transform={`rotate(-90 20 ${marginTop + plotHeight / 2})`}
            fontWeight={600}
          >
            {activeNumCol}
          </text>

          {/* Render Boxes */}
          {groupsStats.map((stat, idx) => {
            const numGroups = groupsStats.length;
            const groupWidth = plotWidth / numGroups;
            const centerX = marginLeft + idx * groupWidth + groupWidth / 2;
            const boxWidth = Math.min(80, Math.max(26, groupWidth * 0.45));
            const color = BOX_COLORS[idx % BOX_COLORS.length];

            const yWhiskerMin = yScale(stat.whiskerMin);
            const yWhiskerMax = yScale(stat.whiskerMax);
            const yQ1 = yScale(stat.q1);
            const yQ3 = yScale(stat.q3);
            const yMedian = yScale(stat.median);
            const yMean = yScale(stat.mean);

            return (
              <g
                key={stat.groupName}
                onMouseEnter={() => setHoveredBox(stat)}
                onMouseLeave={() => setHoveredBox(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Jitter Points (if enabled) */}
                {showJitter && stat.allValues.map((val, vIdx) => {
                  // Pseudo-random deterministic offset based on value and index
                  const seed = Math.sin(vIdx * 997 + val) * 0.5;
                  const jitterX = centerX + seed * (boxWidth * 1.2);
                  const jitterY = yScale(val);
                  return (
                    <circle
                      key={vIdx}
                      cx={jitterX}
                      cy={jitterY}
                      r={3}
                      fill={color}
                      opacity={0.35}
                    />
                  );
                })}

                {/* Whiskers (dashed vertical line) */}
                <line
                  x1={centerX}
                  y1={yWhiskerMin}
                  x2={centerX}
                  y2={yQ1}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <line
                  x1={centerX}
                  y1={yQ3}
                  x2={centerX}
                  y2={yWhiskerMax}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Whisker End Caps (horizontal bars) */}
                <line
                  x1={centerX - boxWidth * 0.3}
                  y1={yWhiskerMin}
                  x2={centerX + boxWidth * 0.3}
                  y2={yWhiskerMin}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                <line
                  x1={centerX - boxWidth * 0.3}
                  y1={yWhiskerMax}
                  x2={centerX + boxWidth * 0.3}
                  y2={yWhiskerMax}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />

                {/* Box (Q1 to Q3) */}
                <rect
                  x={centerX - boxWidth / 2}
                  y={yQ3}
                  width={boxWidth}
                  height={Math.max(2, yQ1 - yQ3)}
                  fill={color}
                  fillOpacity={0.22}
                  stroke={color}
                  strokeWidth="2"
                  rx={4}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Median Line */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMedian}
                  x2={centerX + boxWidth / 2}
                  y2={yMedian}
                  stroke="#f8fafc"
                  strokeWidth="3"
                />

                {/* Mean Diamond Indicator */}
                <polygon
                  points={`${centerX},${yMean - 4} ${centerX + 4},${yMean} ${centerX},${yMean + 4} ${centerX - 4},${yMean}`}
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="1"
                />

                {/* Outliers */}
                {showOutliers && stat.outliers.map((outlierVal, oIdx) => {
                  const outY = yScale(outlierVal);
                  return (
                    <g key={oIdx}>
                      <circle
                        cx={centerX}
                        cy={outY}
                        r={4.5}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* Category Label at bottom */}
                <text
                  x={centerX}
                  y={marginTop + plotHeight + 20}
                  fill="#f8fafc"
                  fontSize={numGroups > 6 ? 10 : 12}
                  textAnchor={numGroups > 6 ? 'end' : 'middle'}
                  transform={numGroups > 6 ? `rotate(-30 ${centerX} ${marginTop + plotHeight + 20})` : undefined}
                  fontWeight={500}
                >
                  {stat.groupName.length > 14 ? `${stat.groupName.slice(0, 12)}...` : stat.groupName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredBox && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--accent-color)',
              borderRadius: '8px',
              padding: '0.85rem 1.15rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
              fontSize: '0.85rem',
              zIndex: 10,
              minWidth: '220px'
            }}
          >
            <div style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', borderBottom: '1px solid #334155', paddingBottom: '0.25rem' }}>
              {hoveredBox.groupName} <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'normal' }}>(N = {hoveredBox.n})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.75rem', color: '#e2e8f0' }}>
              <div>Máx (Bigote): <strong>{hoveredBox.whiskerMax.toFixed(2)}</strong></div>
              <div>Q3 (75%): <strong>{hoveredBox.q3.toFixed(2)}</strong></div>
              <div style={{ color: '#38bdf8' }}>Mediana: <strong>{hoveredBox.median.toFixed(2)}</strong></div>
              <div style={{ color: '#f59e0b' }}>Media (◆): <strong>{hoveredBox.mean.toFixed(2)}</strong></div>
              <div>Q1 (25%): <strong>{hoveredBox.q1.toFixed(2)}</strong></div>
              <div>Mín (Bigote): <strong>{hoveredBox.whiskerMin.toFixed(2)}</strong></div>
              <div>IQR (Q3-Q1): <strong>{hoveredBox.iqr.toFixed(2)}</strong></div>
              <div style={{ color: hoveredBox.outliers.length > 0 ? '#ef4444' : '#10b981' }}>
                Atípicos: <strong>{hoveredBox.outliers.length}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Statistics Table */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '1rem', overflowX: 'auto' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} /> Resumen Estadístico de 5 Números (Tukey)
        </div>
        <table className="data-table" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Grupo / Categoría</th>
              <th>N</th>
              <th>Mínimo</th>
              <th>Q1 (25%)</th>
              <th>Mediana (50%)</th>
              <th>Media (μ)</th>
              <th>Q3 (75%)</th>
              <th>Máximo</th>
              <th>IQR</th>
              <th>Outliers</th>
            </tr>
          </thead>
          <tbody>
            {groupsStats.map((stat, idx) => (
              <tr key={stat.groupName}>
                <td style={{ fontWeight: 600, color: BOX_COLORS[idx % BOX_COLORS.length] }}>
                  {stat.groupName}
                </td>
                <td>{stat.n}</td>
                <td>{stat.min.toFixed(2)}</td>
                <td>{stat.q1.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: '#f8fafc' }}>{stat.median.toFixed(2)}</td>
                <td>{stat.mean.toFixed(2)}</td>
                <td>{stat.q3.toFixed(2)}</td>
                <td>{stat.max.toFixed(2)}</td>
                <td>{stat.iqr.toFixed(2)}</td>
                <td style={{ color: stat.outliers.length > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 600 }}>
                  {stat.outliers.length > 0 ? `${stat.outliers.length} (${((stat.outliers.length / stat.n) * 100).toFixed(1)}%)` : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
