import React, { useState, useRef, useMemo, useDeferredValue } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { linearRegression, linearRegressionLine } from 'simple-statistics';
import { kmeans } from 'ml-kmeans';
import { DecisionTreeClassifier } from 'ml-cart';
import MultivariateLinearRegression from 'ml-regression-multivariate-linear';
import Tree from 'react-d3-tree';
import {
  Line, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Bar,
  PieChart, Pie, Cell, Area, ScatterChart
} from 'recharts';
import { 
  BarChart3, Activity, Download, Upload, Home, 
  FileSpreadsheet, Trash2, Eraser, Filter, Plus, X, RotateCcw, Brain
} from 'lucide-react';
import './index.css';

// Colors for Pie Chart
const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

// Utilidad para evitar colapsos SVG al graficar miles de puntos
const getSampledData = (arr: any[], maxPoints = 2000) => {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0);
};

// Correlation Helpers
const pearsonCorrelation = (x: number[], y: number[]) => {
  const n = x.length;
  if (n === 0) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
};

const getRanks = (arr: number[]) => {
  const sorted = [...arr].map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
  const ranks = new Array(arr.length);
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    let sumRanks = 0;
    while (j < sorted.length && sorted[j].val === sorted[i].val) {
      sumRanks += j + 1;
      j++;
    }
    const avgRank = sumRanks / (j - i);
    for (let k = i; k < j; k++) {
      ranks[sorted[k].idx] = avgRank;
    }
    i = j - 1;
  }
  return ranks;
};

const spearmanCorrelation = (x: number[], y: number[]) => {
  return pearsonCorrelation(getRanks(x), getRanks(y));
};

function App() {
  const [data, setData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [separator, setSeparator] = useState(''); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selector state for charts
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');
  const [chartType, setChartType] = useState<string>('scatter');
  const [exportFormat, setExportFormat] = useState<string>('xlsx');

  const deferredX = useDeferredValue(xAxisCol);
  const deferredY = useDeferredValue(yAxisCol);
  const deferredChartType = useDeferredValue(chartType);
  const isChartPending = xAxisCol !== deferredX || yAxisCol !== deferredY || chartType !== deferredChartType;

  // ML State
  const [mlK, setMlK] = useState<number>(3);
  const [mlX, setMlX] = useState<string>('');
  const [mlY, setMlY] = useState<string>('');
  const [mlResults, setMlResults] = useState<any[]>([]);
  const [isMlRunning, setIsMlRunning] = useState(false);
  const [mlModel, setMlModel] = useState<string>('kmeans');
  const [dtTarget, setDtTarget] = useState<string>('');
  const [dtDepth, setDtDepth] = useState<number>(3);
  const [dtTree, setDtTree] = useState<any>(null);
  
  const [lrTarget, setLrTarget] = useState<string>('');
  const [lrResults, setLrResults] = useState<any>(null);

  // Filter State
  const [filters, setFilters] = useState<{col: string, operator: string, value: string}[]>([
    { col: '', operator: '==', value: '' }
  ]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Limpiar estados de análisis y Machine Learning al cargar un archivo nuevo
    setMlResults([]);
    setMlX('');
    setMlY('');
    setMlK(3);
    setDtTarget('');
    setDtTree(null);
    setLrTarget('');
    setLrResults(null);
    setFilters([{ col: '', operator: '==', value: '' }]);
    setShowHeatmap(false);

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      try {
        const jsonData = JSON.parse(text);
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        if (dataArray.length > 0) {
          setData(dataArray);
          setOriginalData([...dataArray]);
          const cols = Object.keys(dataArray[0] as object);
          setColumns(cols);
          setXAxisCol(cols[0] || '');
          setYAxisCol(cols[1] || cols[0] || '');
        }
      } catch (err) {
        console.error("Error al parsear JSON", err);
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        setData(jsonData);
        setOriginalData([...jsonData]);
        const cols = Object.keys(jsonData[0] as object);
        setColumns(cols);
        setXAxisCol(cols[0] || '');
        setYAxisCol(cols[1] || cols[0] || '');
      }
    } else {
      const parseConfig: Papa.ParseConfig = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.data.length > 0) {
            setData(results.data);
            setOriginalData([...results.data]);
            const cols = Object.keys(results.data[0] as object);
            setColumns(cols);
            setXAxisCol(cols[0] || '');
            setYAxisCol(cols[1] || cols[0] || '');
          }
        }
      };

      if (separator !== '') parseConfig.delimiter = separator;
      Papa.parse(file as any, parseConfig as any);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const exportData = () => {
    if (filteredData.length === 0) return;
    if (exportFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "exported_data.xlsx");
    } else if (exportFormat === 'json') {
      const jsonString = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `exported_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const delimiter = (exportFormat === 'csv' || exportFormat === 'data') ? ',' : '\t';
      const csv = Papa.unparse(filteredData, { delimiter });
      const mimeType = exportFormat === 'data' ? 'application/octet-stream' : 'text/csv;charset=utf-8;';
      const blob = new Blob([csv], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `exported_data.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Data Cleaning Functions
  const removeNullRows = () => {
    const cleaned = data.filter(row => {
      return columns.every(col => row[col] !== null && row[col] !== undefined && row[col] !== '');
    });
    setData(cleaned);
  };

  const imputeNulls = (method: string) => {
    const newData = [...data];
    columns.forEach(col => {
      const numericData = data.map(d => parseFloat(d[col])).filter(n => !isNaN(n));
      if (numericData.length === 0) return; // Skip non-numeric
      
      let fillValue = 0;
      if (method === 'mean') {
        fillValue = numericData.reduce((a, b) => a + b, 0) / numericData.length;
      } else if (method === 'median') {
        const sorted = [...numericData].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        fillValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }

      newData.forEach((row, i) => {
        const val = row[col];
        if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
          newData[i] = { ...newData[i], [col]: Number(fillValue.toFixed(2)) };
        }
      });
    });
    setData(newData);
  };

  const dropColumn = (colToDrop: string) => {
    const newData = data.map(row => {
      const newRow = { ...row };
      delete newRow[colToDrop];
      return newRow;
    });
    setData(newData);
    const newCols = columns.filter(c => c !== colToDrop);
    setColumns(newCols);
    if (xAxisCol === colToDrop) setXAxisCol(newCols[0] || '');
    if (yAxisCol === colToDrop) setYAxisCol(newCols[0] || '');
  };

  const renameColumn = (oldCol: string, newCol: string) => {
    if (oldCol === newCol || columns.includes(newCol) || !newCol) return;
    const newData = data.map(row => {
      const newRow = { ...row };
      newRow[newCol] = newRow[oldCol];
      delete newRow[oldCol];
      return newRow;
    });
    setData(newData);
    const newCols = columns.map(c => c === oldCol ? newCol : c);
    setColumns(newCols);
    if (xAxisCol === oldCol) setXAxisCol(newCol);
    if (yAxisCol === oldCol) setYAxisCol(newCol);
  };

  const updateCell = (rowIndex: number, col: string, value: string) => {
    const newData = [...data];
    // Attempt to keep numbers as numbers, otherwise strings
    newData[rowIndex][col] = isNaN(Number(value)) || value === '' ? value : Number(value);
    setData(newData);
  };

  // Filter state and application (moved to top during refactor)

  const filteredData = useMemo(() => {
    let result = [...data];
    filters.forEach(f => {
      if (!f.col || !f.value) return;
      result = result.filter(row => {
        const rowVal = row[f.col];
        if (rowVal === null || rowVal === undefined) return false;
        
        const numRowVal = Number(rowVal);
        const numFilterVal = Number(f.value);
        const isNum = !isNaN(numRowVal) && !isNaN(numFilterVal);

        switch (f.operator) {
          case '==': return String(rowVal).toLowerCase() === String(f.value).toLowerCase();
          case '!=': return String(rowVal).toLowerCase() !== String(f.value).toLowerCase();
          case '>': return isNum ? numRowVal > numFilterVal : String(rowVal) > String(f.value);
          case '<': return isNum ? numRowVal < numFilterVal : String(rowVal) < String(f.value);
          case '>=': return isNum ? numRowVal >= numFilterVal : String(rowVal) >= String(f.value);
          case '<=': return isNum ? numRowVal <= numFilterVal : String(rowVal) <= String(f.value);
          case 'contains': return String(rowVal).toLowerCase().includes(String(f.value).toLowerCase());
          default: return true;
        }
      });
    });
    return result;
  }, [data, filters]);

  const addFilter = () => setFilters([...filters, { col: columns[0] || '', operator: '==', value: '' }]);
  
  const updateFilter = (index: number, key: string, val: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: val };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters.length ? newFilters : [{ col: columns[0] || '', operator: '==', value: '' }]);
  };

  const resetData = () => {
    setData([...originalData]);
    if (originalData.length > 0) {
      const cols = Object.keys(originalData[0]);
      setColumns(cols);
    }
    setFilters([{ col: '', operator: '==', value: '' }]);
  };

  // Regression Calculation
  const regressionData = useMemo(() => {
    if (!deferredX || !deferredY || filteredData.length === 0) return [];
    
    // Extract pairs of [x, y]
    const validPairs = filteredData
      .map(d => [parseFloat(d[deferredX]), parseFloat(d[deferredY])])
      .filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));

    if (validPairs.length < 2) return [];

    const reg = linearRegression(validPairs);
    const regLine = linearRegressionLine(reg);

    // Create chart data with scatter points and the regression line
    const allValidPoints = filteredData.map(d => {
      const x = parseFloat(d[deferredX]);
      const y = parseFloat(d[deferredY]);
      if (isNaN(x) || isNaN(y)) return null;
      return {
        x: x,
        y: y,
        trend: regLine(x)
      };
    }).filter(Boolean);
    
    return getSampledData(allValidPoints, 2000);
  }, [filteredData, deferredX, deferredY]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Activity size={28} />
          <span>StatixPro</span>
        </div>
        
        <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Home size={20} /> <span>Dashboard</span>
        </div>
        <div className={`menu-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
          <FileSpreadsheet size={20} /> <span>Dataset & Cleaning</span>
        </div>
        <div className={`menu-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
          <BarChart3 size={20} /> <span>Estadística & Modelos</span>
        </div>
        <div className={`menu-item ${activeTab === 'ml' ? 'active' : ''}`} onClick={() => setActiveTab('ml')}>
          <Brain size={20} /> <span>Machine Learning</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header" style={{ paddingRight: '150px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'data' ? 'Data Editor' : 'Advanced Analysis'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="ui-select"
              title="Separador CSV/TXT"
              style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px' }}
            >
              <option value="">Auto-detectar</option>
              <option value=",">Coma (,)</option>
              <option value=";">Punto y coma (;)</option>
              <option value="\t">Tab (TXT/DATA)</option>
              <option value=" ">Espacio (DATA)</option>
            </select>
            <input 
              type="file" 
              accept=".csv, .txt, .xlsx, .xls, .data, .json" 
              className="hidden-input" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button className="btn btn-outline" onClick={triggerFileInput}>
              <Upload size={18} /> Importar Datos
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select 
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px 0 0 5px', borderRight: 'none', border: '1px solid var(--accent-color)' }}
              >
                <option value="xlsx">Excel</option>
                <option value="csv">CSV</option>
                <option value="txt">TXT</option>
                <option value="data">Data (.data)</option>
                <option value="json">JSON (.json)</option>
              </select>
              <button className="btn" onClick={exportData} disabled={data.length === 0} style={{ borderRadius: '0 5px 5px 0' }}>
                <Download size={18} /> Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="workspace">
          {data.length === 0 ? (
            <div className="empty-state">
              <Upload size={48} />
              <h3>No hay datos</h3>
              <p>Importa un CSV, TXT o Excel para comenzar.</p>
              <button className="btn" onClick={triggerFileInput}>Buscar Archivo</button>
            </div>
          ) : (
            <div className="dashboard-grid">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="card col-span-4">
                    <div className="card-header">Total Registros (Filas)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                      {filteredData.length.toLocaleString()}
                    </div>
                  </div>
                  <div className="card col-span-4">
                    <div className="card-header">Variables (Columnas)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success-color)' }}>
                      {columns.length}
                    </div>
                  </div>
                  <div className="card col-span-4">
                    <div className="card-header">Celdas Válidas</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b' }}>
                      {filteredData.length ? Math.round((filteredData.filter(row => columns.every(col => row[col] !== null && row[col] !== '')).length / filteredData.length) * 100) : 0}%
                    </div>
                  </div>
                </>
              )}
              
              {/* DATA TAB */}
              {activeTab === 'data' && (
                <>
                  <div className="card col-span-12" style={{ marginBottom: '1rem' }}>
                    <div className="card-header"><Filter size={18} /> Filtrado Avanzado de Datos</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {filters.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select value={f.col} onChange={e => updateFilter(i, 'col', e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', flex: 1 }}>
                            <option value="">-- Seleccionar Columna --</option>
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={f.operator} onChange={e => updateFilter(i, 'operator', e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px' }}>
                            <option value="==">Es igual a (=)</option>
                            <option value="!=">Diferente a (!=)</option>
                            <option value=">">Mayor que {'>'}</option>
                            <option value="<">Menor que {'<'}</option>
                            <option value=">=">Mayor o igual {'>='}</option>
                            <option value="<=">Menor o igual {'<='}</option>
                            <option value="contains">Contiene (valor)</option>
                          </select>
                          <input type="text" value={f.value} onChange={e => updateFilter(i, 'value', e.target.value)} placeholder="Valor de filtro" style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', outline: 'none', flex: 1 }} />
                          <button onClick={() => removeFilter(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={addFilter} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                          <Plus size={14} /> Añadir regla
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card col-span-12" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={removeNullRows} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} title="Eliminar filas con valores nulos (NaN)">
                      <Eraser size={18} /> Eliminar Nulos
                    </button>
                    <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Imputar:</span>
                    <button className="btn btn-outline" onClick={() => imputeNulls('mean')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                      Media
                    </button>
                    <button className="btn btn-outline" onClick={() => imputeNulls('median')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                      Mediana
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-outline" onClick={resetData} disabled={originalData.length === 0} style={{ color: 'var(--warning-color)', borderColor: 'var(--warning-color)' }} title="Restaurar el dataset a su estado original">
                      <RotateCcw size={18} /> Restaurar Datos Originales
                    </button>
                  </div>
                  <div className="card col-span-12" style={{ overflowX: 'auto', maxHeight: '65vh' }}>
                    <div className="card-header">Dataset Viewer</div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {columns.map(col => (
                            <th key={col}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                  type="text" 
                                  defaultValue={col}
                                  onBlur={(e) => renameColumn(col, e.target.value)}
                                  style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                    fontWeight: 500, fontSize: '0.875rem', textTransform: 'uppercase',
                                    outline: 'none', width: '100px'
                                  }}
                                  title="Editar nombre de columna"
                                />
                                <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--danger-color)', flexShrink: 0 }} onClick={() => dropColumn(col)} />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.slice(0, 50).map((row, i) => (
                          <tr key={i}>
                            {columns.map(col => (
                              <td key={col}>
                                <input 
                                  type="text"
                                  value={row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                                  onChange={(e) => {
                                    // To allow edits through filter, we need to find the real index in `data`
                                    const realIndex = data.findIndex(d => d === row);
                                    if(realIndex !== -1) updateCell(realIndex, col, e.target.value);
                                  }}
                                  style={{
                                    background: 'transparent', border: 'none', color: 'inherit',
                                    width: '100%', outline: 'none', fontFamily: 'inherit'
                                  }}
                                  title="Editar celda"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && (
                <>
                  <div className="card col-span-12" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Eje X (Independiente)</label>
                      <select value={xAxisCol} onChange={e => setXAxisCol(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px' }}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Eje Y (Dependiente)</label>
                      <select value={yAxisCol} onChange={e => setYAxisCol(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px' }}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo de Gráfico</label>
                      <select value={chartType} onChange={e => setChartType(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px' }}>
                        <option value="scatter">Dispersión y Regresión</option>
                        <option value="bar">Gráfico de Barras</option>
                        <option value="line">Gráfico de Líneas</option>
                        <option value="area">Gráfico de Área</option>
                        <option value="pie">Gráfico Circular (Pie)</option>
                      </select>
                    </div>
                  </div>

                  <div className="card col-span-12" style={{ height: '400px', marginBottom: '1rem', position: 'relative' }}>
                    <div className="card-header">Visualización de Datos</div>
                    
                    {isChartPending && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '8px' }}>
                        <div style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <RotateCcw size={20} className="spin" /> Actualizando Gráfico...
                        </div>
                      </div>
                    )}

                    {regressionData.length < 2 && deferredChartType === 'scatter' ? (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Las variables seleccionadas no son completamente numéricas o no tienen suficientes datos para graficar una dispersión.
                      </div>
                    ) : deferredChartType === 'pie' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {(() => {
                            const isYNumeric = filteredData.some(d => d[deferredY] !== null && d[deferredY] !== '' && !isNaN(Number(d[deferredY])));
                            
                            let pieData: any[] = [];
                            if (isYNumeric) {
                              pieData = filteredData
                                .filter(d => d[deferredY] !== null && d[deferredY] !== '' && !isNaN(Number(d[deferredY])))
                                .map(d => ({ ...d, [deferredY]: Number(d[deferredY]) }))
                                .slice(0, 15);
                            } else {
                              const counts = filteredData.reduce((acc, row) => {
                                const key = String(row[deferredX] || 'N/A');
                                acc[key] = (acc[key] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              pieData = Object.entries(counts)
                                .map(([key, count]) => ({ [deferredX]: key, [deferredY]: count }))
                                .sort((a, b) => (b[deferredY] as number) - (a[deferredY] as number))
                                .slice(0, 15);
                            }
                            
                            if (pieData.length === 0) {
                              return <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8">No hay datos numéricos para graficar</text>;
                            }

                            return (
                              <>
                                <Pie 
                                  data={pieData} 
                                  dataKey={deferredY} 
                                  nameKey={deferredX} 
                                  cx="50%" 
                                  cy="50%" 
                                  outerRadius={120} 
                                  label 
                                >
                                  {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.8rem' }} />
                              </>
                            );
                          })()}
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          const isYNumeric = filteredData.some(d => d[deferredY] !== null && d[deferredY] !== '' && !isNaN(Number(d[deferredY])));
                          
                          let finalData = filteredData;
                          let actualYKey = deferredY;
                          let yName = deferredY;

                          if (deferredChartType !== 'scatter' && !isYNumeric) {
                            const counts = filteredData.reduce((acc, row) => {
                              const key = String(row[deferredX] || 'N/A');
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            finalData = Object.entries(counts).map(([key, count]) => ({ [deferredX]: key, _count: count }));
                            actualYKey = '_count';
                            yName = `Cantidad (Conteo de ${deferredY})`;
                          } else if (isYNumeric) {
                            finalData = filteredData.map(d => ({ ...d, [actualYKey]: d[actualYKey] !== null && d[actualYKey] !== '' ? Number(d[actualYKey]) : null }));
                          }

                          return (
                            <ComposedChart data={deferredChartType === 'scatter' ? regressionData : finalData.slice(0, 100)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis 
                                type={deferredChartType === 'scatter' ? 'number' : 'category'} 
                                dataKey={deferredChartType === 'scatter' ? 'x' : deferredX} 
                                name={deferredX} 
                                stroke="#94a3b8" 
                              />
                              <YAxis 
                                type={deferredChartType === 'scatter' ? 'number' : 'number'} 
                                dataKey={deferredChartType === 'scatter' ? 'y' : actualYKey} 
                                name={yName} 
                                stroke="#94a3b8" 
                              />
                              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                              <Legend />
                              {deferredChartType === 'scatter' && <Scatter name="Datos" dataKey="y" fill="#38bdf8" />}
                              {deferredChartType === 'scatter' && <Line type="monotone" dataKey="trend" name="Regresión Lineal" stroke="#10b981" dot={false} strokeWidth={2} />}
                              
                              {deferredChartType === 'bar' && <Bar name={yName} dataKey={actualYKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />}
                              {deferredChartType === 'line' && <Line name={yName} type="monotone" dataKey={actualYKey} stroke="#10b981" activeDot={{ r: 8 }} />}
                              {deferredChartType === 'area' && <Area name={yName} type="monotone" dataKey={actualYKey} fill="#8b5cf6" stroke="#8b5cf6" opacity={0.6} />}
                            </ComposedChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="card col-span-12" style={{ overflowX: 'auto' }}>
                    <div className="card-header">Estadística Descriptiva Automática</div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Variable</th>
                          <th>N (Válidos)</th>
                          <th>Media</th>
                          <th>Mediana</th>
                          <th>Desv. Estándar</th>
                          <th>Mínimo</th>
                          <th>Máximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map(col => {
                          const numericData = data.map(d => parseFloat(d[col])).filter(n => !isNaN(n));
                          if (numericData.length === 0) return null;
                          
                          const n = numericData.length;
                          const min = Math.min(...numericData);
                          const max = Math.max(...numericData);
                          const sum = numericData.reduce((a, b) => a + b, 0);
                          const mean = sum / n;
                          
                          const variance = numericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
                          const stdDev = Math.sqrt(variance);
                          
                          const sorted = [...numericData].sort((a, b) => a - b);
                          const mid = Math.floor(n / 2);
                          const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

                          return (
                            <tr key={col}>
                              <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{col}</td>
                              <td>{n}</td>
                              <td>{mean.toFixed(4)}</td>
                              <td>{median.toFixed(4)}</td>
                              <td>{stdDev.toFixed(4)}</td>
                              <td>{min}</td>
                              <td>{max}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="card col-span-12" style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Coeficientes de Correlación (Pearson y Spearman)</span>
                      <button className="btn btn-outline" onClick={() => setShowHeatmap(!showHeatmap)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                        {showHeatmap ? 'Ver Tabla' : 'Ver Mapa de Calor'}
                      </button>
                    </div>
                    {(() => {
                      const numCols = columns.filter(col => data.some(d => d[col] !== null && d[col] !== '' && !isNaN(Number(d[col]))));
                      if (numCols.length < 2) {
                        return <div style={{ padding: '1rem', textAlign: 'center' }}>No hay suficientes variables numéricas para calcular correlación.</div>;
                      }

                      if (showHeatmap) {
                        return (
                          <div style={{ padding: '1rem', overflowX: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${numCols.length}, minmax(60px, 1fr))`, gap: '4px' }}>
                              <div></div>
                              {numCols.map(c => <div key={c} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c}>{c}</div>)}
                              
                              {numCols.map(rowCol => (
                                <React.Fragment key={rowCol}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>{rowCol}</div>
                                  {numCols.map(col => {
                                    let r = 1;
                                    if (rowCol !== col) {
                                      const validData = data.filter(d => 
                                        d[rowCol] !== null && d[rowCol] !== '' && !isNaN(Number(d[rowCol])) &&
                                        d[col] !== null && d[col] !== '' && !isNaN(Number(d[col]))
                                      );
                                      if (validData.length > 1) {
                                        const x = validData.map(d => Number(d[rowCol]));
                                        const y = validData.map(d => Number(d[col]));
                                        r = pearsonCorrelation(x, y);
                                      } else {
                                        r = 0;
                                      }
                                    }
                                    const intensity = Math.min(1, Math.abs(r));
                                    
                                    // Escala de colores estilo "coolwarm" (Azul -> Blanco -> Rojo)
                                    let bgR, bgG, bgB;
                                    if (r >= 0) {
                                      // De gris claro (241, 245, 249) a rojo oscuro (178, 24, 43)
                                      bgR = Math.round(241 + (178 - 241) * intensity);
                                      bgG = Math.round(245 + (24 - 245) * intensity);
                                      bgB = Math.round(249 + (43 - 249) * intensity);
                                    } else {
                                      // De gris claro (241, 245, 249) a azul oscuro (33, 102, 172)
                                      bgR = Math.round(241 + (33 - 241) * intensity);
                                      bgG = Math.round(245 + (102 - 245) * intensity);
                                      bgB = Math.round(249 + (172 - 249) * intensity);
                                    }
                                    const color = `rgb(${bgR}, ${bgG}, ${bgB})`;
                                    const textColor = intensity > 0.5 ? '#ffffff' : '#0f172a';
                                    
                                    return (
                                      <div key={col} style={{ 
                                        background: color, 
                                        color: textColor,
                                        padding: '0.75rem 0.25rem', 
                                        textAlign: 'center', 
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        border: '1px solid var(--border-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }} title={`r = ${r.toFixed(4)}`}>
                                        {r.toFixed(2)}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Variable 1</th>
                              <th>Variable 2</th>
                              <th>Pearson (r)</th>
                              <th>Spearman (ρ)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const pairs = [];
                              for (let i = 0; i < numCols.length; i++) {
                                for (let j = i + 1; j < numCols.length; j++) {
                                  const col1 = numCols[i];
                                  const col2 = numCols[j];
                                  
                                  const validData = data.filter(d => 
                                    d[col1] !== null && d[col1] !== '' && !isNaN(Number(d[col1])) &&
                                    d[col2] !== null && d[col2] !== '' && !isNaN(Number(d[col2]))
                                  );
                                  
                                  if (validData.length > 1) {
                                    const x = validData.map(d => Number(d[col1]));
                                    const y = validData.map(d => Number(d[col2]));
                                    const p = pearsonCorrelation(x, y);
                                    const s = spearmanCorrelation(x, y);
                                    pairs.push(
                                      <tr key={`${col1}-${col2}`}>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{col1}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{col2}</td>
                                        <td style={{ color: p > 0.7 || p < -0.7 ? 'var(--success-color)' : 'inherit' }}>{p.toFixed(4)}</td>
                                        <td style={{ color: s > 0.7 || s < -0.7 ? 'var(--success-color)' : 'inherit' }}>{s.toFixed(4)}</td>
                                      </tr>
                                    );
                                  }
                                }
                              }
                              return pairs;
                            })()}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </>
              )}
              
              {/* MACHINE LEARNING TAB */}
              {activeTab === 'ml' && (
                <>
                  <div className="card col-span-12" style={{ marginBottom: '1rem' }}>
                    <div className="card-header"><Brain size={18} /> Modelos Avanzados de Machine Learning</div>
                    
                    {/* Algoritmo Selector */}
                    <div style={{ marginTop: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Seleccionar Algoritmo</label>
                      <select value={mlModel} onChange={e => { setMlModel(e.target.value); setMlResults([]); setDtTree(null); setLrResults(null); }} className="ui-select" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--accent-color)' }}>
                        <option value="kmeans">K-Means Clustering (No Supervisado)</option>
                        <option value="decision_tree">Árboles de Decisión (Supervisado)</option>
                        <option value="linear_regression">Regresión Lineal Múltiple (Supervisado)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                      
                      {/* K-MEANS */}
                      {mlModel === 'kmeans' && (
                        <>
                          <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>1. K-Means Clustering</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                          Encuentra grupos y patrones ocultos en tus datos dividiéndolos en clusters basados en su similitud.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Eje X (Variable 1)</label>
                            <select value={mlX} onChange={e => setMlX(e.target.value)} className="ui-select" style={{ width: '100%', background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                              <option value="">-- Seleccionar --</option>
                              {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Eje Y (Variable 2)</label>
                            <select value={mlY} onChange={e => setMlY(e.target.value)} className="ui-select" style={{ width: '100%', background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                              <option value="">-- Seleccionar --</option>
                              {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Número de Clusters (K)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                              <button 
                                className="btn btn-outline" 
                                onClick={() => setMlK(Math.max(2, mlK - 1))}
                                disabled={mlK <= 2}
                                style={{ padding: '0.25rem 1rem', fontSize: '1.2rem', flex: 1 }}
                              >-</button>
                              <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-color)' }}>{mlK}</span>
                              <button 
                                className="btn btn-outline" 
                                onClick={() => setMlK(Math.min(10, mlK + 1))}
                                disabled={mlK >= 10}
                                style={{ padding: '0.25rem 1rem', fontSize: '1.2rem', flex: 1 }}
                              >+</button>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          className="btn" 
                          disabled={!mlX || !mlY || isMlRunning}
                          onClick={() => {
                            if (!mlX || !mlY) return;
                            setIsMlRunning(true);
                            // Pequeño timeout para permitir que la UI se actualice a "Cargando..." si fuera necesario
                            setTimeout(() => {
                              const validData = filteredData
                                .filter(d => d[mlX] !== null && d[mlX] !== '' && !isNaN(Number(d[mlX])))
                                .filter(d => d[mlY] !== null && d[mlY] !== '' && !isNaN(Number(d[mlY])))
                                .map(d => [Number(d[mlX]), Number(d[mlY])]);
                              
                              if (validData.length >= mlK) {
                                try {
                                  const result = kmeans(validData, mlK, { maxIterations: 100 });
                                  const formattedResults = validData.map((d, i) => ({
                                    x: d[0],
                                    y: d[1],
                                    cluster: result.clusters[i]
                                  }));
                                  setMlResults(formattedResults);
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                              setIsMlRunning(false);
                            }, 100);
                          }}
                          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1.05rem' }}
                        >
                          <Brain size={20} /> {isMlRunning ? 'Entrenando...' : 'Entrenar Modelo K-Means'}
                        </button>
                      </div>

                      {/* Visualization Panel */}
                      <div style={{ height: '500px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                        {mlResults.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis type="number" dataKey="x" name={mlX} stroke="#94a3b8" height={60} label={{ value: mlX, position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                              <YAxis type="number" dataKey="y" name={mlY} stroke="#94a3b8" width={100} label={{ value: mlY, angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', style: { textAnchor: 'middle' } }} />
                              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                              {(() => {
                                const sampledResults = getSampledData(mlResults);
                                const uniqueClusters = Array.from(new Set(mlResults.map(d => d.cluster))).sort((a, b) => a - b);
                                return uniqueClusters.map((clusterId) => (
                                  <Scatter 
                                    key={`cluster-${clusterId}`} 
                                    name={`Cluster ${clusterId + 1}`} 
                                    data={sampledResults.filter((d: any) => d.cluster === clusterId)} 
                                    fill={COLORS[clusterId % COLORS.length]} 
                                  />
                                ));
                              })()}
                              <Legend verticalAlign="top" height={36}/>
                            </ScatterChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
                            <Brain size={48} style={{ opacity: 0.2 }} />
                            <p>Configura las variables y pulsa <b>Entrenar Modelo</b><br/>para visualizar los clusters generados.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* DECISION TREE */}
                      {mlModel === 'decision_tree' && (
                        <>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#8b5cf6' }}>2. Árboles de Decisión (Clasificación)</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                              Predice categorías (Variable Objetivo) creando reglas lógicas simples basadas en el resto de variables numéricas.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Variable Objetivo (Clase a predecir)</label>
                                <select value={dtTarget} onChange={e => setDtTarget(e.target.value)} className="ui-select" style={{ width: '100%', background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                                  <option value="">-- Seleccionar --</option>
                                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Profundidad Máxima del Árbol</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                                  <button className="btn btn-outline" onClick={() => setDtDepth(Math.max(1, dtDepth - 1))} disabled={dtDepth <= 1} style={{ padding: '0.25rem 1rem', fontSize: '1.2rem', flex: 1, borderColor: '#8b5cf6', color: '#8b5cf6' }}>-</button>
                                  <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#8b5cf6' }}>{dtDepth}</span>
                                  <button className="btn btn-outline" onClick={() => setDtDepth(Math.min(10, dtDepth + 1))} disabled={dtDepth >= 10} style={{ padding: '0.25rem 1rem', fontSize: '1.2rem', flex: 1, borderColor: '#8b5cf6', color: '#8b5cf6' }}>+</button>
                                </div>
                              </div>
                            </div>
                            
                              <button 
                                className="btn" 
                                disabled={!dtTarget || isMlRunning}
                                onClick={() => {
                                  if (!dtTarget) return;
                                  setIsMlRunning(true);
                                  setTimeout(() => {
                                    try {
                                    const validData = filteredData.filter(d => d[dtTarget] !== null && d[dtTarget] !== '');
                                    const featureCols = columns.filter(c => c !== dtTarget && validData.some(d => !isNaN(Number(d[c]))));
                                    
                                    if (validData.length > 0 && featureCols.length > 0) {
                                      const t0 = performance.now();
                                      
                                      // Para evitar congelaciones > 1s, limitamos el entrenamiento a una muestra estratificada rápida
                                      const sampleLimit = 5000;
                                      const trainData = getSampledData(validData, sampleLimit);
                                      
                                      const X = trainData.map(d => featureCols.map(c => Number(d[c]) || 0));
                                      const yRaw = trainData.map(d => String(d[dtTarget]));
                                      const uniqueClasses = Array.from(new Set(yRaw));
                                      const y = yRaw.map(label => uniqueClasses.indexOf(label));
                                      
                                      const classifier = new DecisionTreeClassifier({ maxDepth: dtDepth, gainFunction: 'gini', minNumSamples: 2 });
                                      classifier.train(X, y);
                                      
                                      const t1 = performance.now();
                                      
                                      const cleanTree = (node: any, features: string[], classes: any[]): any => {
                                        if (!node) return null;
                                        const isLeaf = !node.left && !node.right;
                                        let name = "";
                                        let attributes: any = {};
                                        
                                        if (node.distribution) {
                                          try {
                                            let dist = node.distribution;
                                            if (dist && dist.data) dist = dist.data;
                                            if (dist && typeof dist.length === 'number') dist = Array.from(dist);
                                            if (Array.isArray(dist) && dist.length > 0 && typeof dist[0] === 'object' && dist[0] !== null && typeof dist[0].length === 'number') {
                                              dist = Array.from(dist[0]);
                                            }
                                            
                                            if (Array.isArray(dist)) {
                                              const maxVal = Math.max(...dist);
                                              const maxIdx = dist.indexOf(maxVal);
                                              const className = classes[maxIdx] !== undefined ? classes[maxIdx] : `Clase #${maxIdx}`;
                                              attributes["Predicción"] = `${className} (${Math.round(maxVal * 100)}%)`;
                                            } else if (typeof dist === 'object' && dist !== null) {
                                              const entries = Object.entries(dist);
                                              let maxKey = entries[0][0];
                                              let maxVal = entries[0][1] as number;
                                              for (let [k, v] of entries) {
                                                if (typeof v === 'number' && v > maxVal) { maxVal = v; maxKey = k; }
                                              }
                                              const classId = parseInt(maxKey, 10);
                                              const className = (!isNaN(classId) && classes[classId] !== undefined) ? classes[classId] : maxKey;
                                              attributes["Predicción"] = `${className} (${Math.round(maxVal * 100)}%)`;
                                            }
                                          } catch (e) {
                                            attributes["Predicción"] = "Hoja";
                                          }
                                        }
                                        
                                        if (isLeaf) {
                                          name = "Nodo Final";
                                        } else {
                                          name = features[node.splitColumn] || `Columna ${node.splitColumn}`;
                                          if (node.splitValue !== undefined) {
                                            attributes["Condición"] = `< ${node.splitValue.toFixed(2)}`;
                                          }
                                        }
                                        
                                        const children = [];
                                        if (node.left) {
                                          const leftChild = cleanTree(node.left, features, classes);
                                          if (leftChild) children.push({ ...leftChild, name: `[✓ Sí] ${leftChild.name}` });
                                        }
                                        if (node.right) {
                                          const rightChild = cleanTree(node.right, features, classes);
                                          if (rightChild) children.push({ ...rightChild, name: `[✗ No] ${rightChild.name}` });
                                        }
                                        
                                        const result: any = { name };
                                        if (Object.keys(attributes).length > 0) result.attributes = attributes;
                                        if (children.length > 0) result.children = children;
                                        return result;
                                      };
                                      
                                      const rawTree = classifier.toJSON();
                                      const displayTree = cleanTree(rawTree.root, featureCols, uniqueClasses);

                                      setDtTree({ 
                                        model: displayTree, 
                                        features: featureCols, 
                                        target: dtTarget,
                                        timeMs: (t1 - t0).toFixed(1),
                                        sampleSize: trainData.length,
                                        totalSize: validData.length
                                      });
                                    }
                                  } catch (e) {
                                    console.error("Error entrenando arbol:", e);
                                  }
                                  setIsMlRunning(false);
                                }, 100);
                              }}
                              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1.05rem', backgroundColor: '#8b5cf6', color: 'white' }}
                            >
                              <Brain size={20} /> {isMlRunning ? 'Entrenando...' : 'Entrenar Árbol de Decisión'}
                            </button>
                          </div>

                          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border-color)', minHeight: '300px' }}>
                            {dtTree ? (
                              <div style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', fontSize: '0.9rem' }}>
                                <h4 style={{ color: 'var(--success-color)', marginBottom: '1rem', fontSize: '1.2rem' }}>Modelo Entrenado con Éxito</h4>
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                  <p style={{ color: 'var(--text-primary)', margin: 0 }}><strong>Target:</strong> {dtTree.target}</p>
                                  <p style={{ color: 'var(--text-primary)', margin: 0 }}><strong>Muestra Analizada:</strong> {dtTree.sampleSize} / {dtTree.totalSize} filas</p>
                                  <p style={{ color: 'var(--text-primary)', margin: 0 }}><strong>Tiempo Computación:</strong> {dtTree.timeMs}ms</p>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>Características (X):</strong> {dtTree.features.join(', ')}</p>
                                <div style={{ height: '500px', width: '100%', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', position: 'relative' }}>
                                  <style>{`
                                    .rd3t-link { stroke: #64748b !important; stroke-width: 2px !important; }
                                  `}</style>
                                  <Tree 
                                    data={dtTree.model} 
                                    orientation="vertical"
                                    pathFunc="step"
                                    translate={{ x: 300, y: 50 }}
                                    nodeSize={{ x: 350, y: 150 }}
                                    renderCustomNodeElement={({ nodeDatum, toggleNode }: any) => (
                                      <g>
                                        <circle r="16" fill={nodeDatum.children ? "#8b5cf6" : "#10b981"} stroke="#0f172a" strokeWidth="3" onClick={toggleNode} style={{ cursor: 'pointer' }} />
                                        <foreignObject x="24" y="-12" width="300" height="100" style={{ pointerEvents: 'none' }}>
                                          <div style={{ color: '#f8fafc', fontFamily: 'system-ui, sans-serif', textAlign: 'left' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>
                                              {nodeDatum.name}
                                            </div>
                                            {nodeDatum.attributes && Object.entries(nodeDatum.attributes).map(([key, val]) => (
                                              <div key={key} style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                {key}: {val as React.ReactNode}
                                              </div>
                                            ))}
                                          </div>
                                        </foreignObject>
                                      </g>
                                    )}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
                                <Brain size={48} style={{ opacity: 0.2 }} />
                                <p>Configura la variable a predecir y entrena el modelo<br/>para visualizar la estructura lógica del Árbol.</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* MULTIVARIATE LINEAR REGRESSION */}
                      {mlModel === 'linear_regression' && (
                        <>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>3. Regresión Lineal Múltiple</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                              Estima el valor de una variable numérica continua utilizando todas las demás variables numéricas disponibles en la base de datos.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Variable Objetivo (Número a predecir)</label>
                                <select value={lrTarget} onChange={e => setLrTarget(e.target.value)} className="ui-select" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                                  <option value="">-- Seleccionar --</option>
                                  {columns.filter(c => originalData.some(d => !isNaN(Number(d[c])))).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </div>
                            
                            <button 
                              className="btn" 
                              disabled={!lrTarget || isMlRunning}
                              onClick={() => {
                                if (!lrTarget) return;
                                setIsMlRunning(true);
                                setTimeout(() => {
                                  try {
                                    const validData = filteredData.filter(d => d[lrTarget] !== null && d[lrTarget] !== '' && !isNaN(Number(d[lrTarget])));
                                    const featureCols = columns.filter(c => c !== lrTarget && validData.some(d => !isNaN(Number(d[c]))));
                                    
                                    if (validData.length > 0 && featureCols.length > 0) {
                                      const t0 = performance.now();
                                      
                                      const X = validData.map(d => featureCols.map(c => Number(d[c]) || 0));
                                      const y = validData.map(d => [Number(d[lrTarget])]);
                                      
                                      const mlr = new MultivariateLinearRegression(X, y);
                                      const t1 = performance.now();
                                      
                                      const weightsArray = mlr.weights.map((w: any) => w[0]);
                                      // The last weight is the intercept in ml-regression-multivariate-linear
                                      const intercept = weightsArray[weightsArray.length - 1];
                                      const coefficients = weightsArray.slice(0, weightsArray.length - 1);
                                      
                                      setLrResults({ 
                                        target: lrTarget,
                                        features: featureCols,
                                        coefficients,
                                        intercept,
                                        timeMs: (t1 - t0).toFixed(1),
                                        sampleSize: validData.length
                                      });
                                    }
                                  } catch (e) {
                                    console.error("Error en regresion:", e);
                                  }
                                  setIsMlRunning(false);
                                }, 100);
                              }}
                              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1.05rem', backgroundColor: '#ec4899', color: 'white' }}
                            >
                              <Brain size={20} /> {isMlRunning ? 'Entrenando...' : 'Calcular Regresión Lineal'}
                            </button>
                          </div>

                          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border-color)', minHeight: '300px', marginTop: '1.5rem' }}>
                            {lrResults ? (
                              <div>
                                <h4 style={{ color: '#ec4899', marginBottom: '1rem', fontSize: '1.2rem' }}>Modelo de Regresión Calculado</h4>
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                  <p style={{ margin: 0, color: 'var(--text-primary)' }}><strong>Target:</strong> {lrResults.target}</p>
                                  <p style={{ margin: 0, color: 'var(--text-primary)' }}><strong>Muestra Analizada:</strong> {lrResults.sampleSize} filas</p>
                                  <p style={{ margin: 0, color: 'var(--text-primary)' }}><strong>Tiempo:</strong> {lrResults.timeMs}ms</p>
                                </div>
                                
                                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                  <h5 style={{ color: '#94a3b8', marginBottom: '1rem' }}>Ecuación Predictiva (Fórmula Matemática):</h5>
                                  <div style={{ fontSize: '1.1rem', lineHeight: '2.5', fontFamily: 'monospace', color: '#f8fafc' }}>
                                    <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{lrResults.target}</span> = <br/>
                                    <span style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{lrResults.intercept.toFixed(4)}</span> <span style={{ color: '#64748b' }}>(Base)</span>
                                    {lrResults.coefficients.map((coef: number, i: number) => (
                                      <React.Fragment key={i}>
                                        <br/> <span style={{ color: coef >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{coef >= 0 ? '+ ' : '- '}</span> 
                                        {Math.abs(coef).toFixed(4)} × <span style={{ color: '#38bdf8' }}>[{lrResults.features[i]}]</span>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
                                <Brain size={48} style={{ opacity: 0.2 }} />
                                <p>Configura la variable a predecir y entrena el modelo<br/>para obtener la fórmula matemática exacta.</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
