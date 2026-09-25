import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { linearRegression, linearRegressionLine } from 'simple-statistics';
import {
  Line, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Bar,
  PieChart, Pie, Cell, Area
} from 'recharts';
import { 
  BarChart3, Activity, Download, Upload, Home, 
  FileSpreadsheet, Trash2, Eraser, Filter, Plus, X, RotateCcw
} from 'lucide-react';
import './index.css';

// Colors for Pie Chart
const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

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

  // Filter State
  const [filters, setFilters] = useState<{col: string, operator: string, value: string}[]>([
    { col: '', operator: '==', value: '' }
  ]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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
        complete: (results) => {
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
      Papa.parse(file, parseConfig);
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
    } else {
      const csv = Papa.unparse(filteredData, { delimiter: exportFormat === 'csv' ? ',' : '\t' });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
    if (!xAxisCol || !yAxisCol || filteredData.length === 0) return [];
    
    // Extract pairs of [x, y]
    const validPairs = filteredData
      .map(d => [parseFloat(d[xAxisCol]), parseFloat(d[yAxisCol])])
      .filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));

    if (validPairs.length < 2) return [];

    const reg = linearRegression(validPairs);
    const regLine = linearRegressionLine(reg);

    // Create chart data with scatter points and the regression line
    return filteredData.map(d => {
      const x = parseFloat(d[xAxisCol]);
      const y = parseFloat(d[yAxisCol]);
      if (isNaN(x) || isNaN(y)) return null;
      return {
        x: x,
        y: y,
        trend: regLine(x)
      };
    }).filter(Boolean);
  }, [filteredData, xAxisCol, yAxisCol]);

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
              <option value="\t">Tab (TXT)</option>
            </select>
            <input 
              type="file" 
              accept=".csv, .txt, .xlsx, .xls" 
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

                  <div className="card col-span-12" style={{ height: '400px', marginBottom: '1rem' }}>
                    <div className="card-header">Visualización de Datos</div>
                    {regressionData.length < 2 && chartType === 'scatter' ? (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Las variables seleccionadas no son completamente numéricas o no tienen suficientes datos para graficar una dispersión.
                      </div>
                    ) : chartType === 'pie' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={filteredData.filter(d => d[yAxisCol] !== null && !isNaN(Number(d[yAxisCol]))).slice(0, 20)} 
                            dataKey={yAxisCol} 
                            nameKey={xAxisCol} 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={130} 
                            label 
                          >
                            {filteredData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartType === 'scatter' ? regressionData : filteredData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            type={chartType === 'scatter' ? 'number' : 'category'} 
                            dataKey={chartType === 'scatter' ? 'x' : xAxisCol} 
                            name={xAxisCol} 
                            stroke="#94a3b8" 
                          />
                          <YAxis 
                            type={chartType === 'scatter' ? 'number' : 'number'} 
                            dataKey={chartType === 'scatter' ? 'y' : yAxisCol} 
                            name={yAxisCol} 
                            stroke="#94a3b8" 
                          />
                          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b' }} />
                          <Legend />
                          {chartType === 'scatter' && <Scatter name="Datos" dataKey="y" fill="#38bdf8" />}
                          {chartType === 'scatter' && <Line type="monotone" dataKey="trend" name="Regresión Lineal" stroke="#10b981" dot={false} strokeWidth={2} />}
                          
                          {chartType === 'bar' && <Bar name={yAxisCol} dataKey={yAxisCol} fill="#38bdf8" radius={[4, 4, 0, 0]} />}
                          {chartType === 'line' && <Line name={yAxisCol} type="monotone" dataKey={yAxisCol} stroke="#10b981" activeDot={{ r: 8 }} />}
                          {chartType === 'area' && <Area name={yAxisCol} type="monotone" dataKey={yAxisCol} fill="#8b5cf6" stroke="#8b5cf6" opacity={0.6} />}
                        </ComposedChart>
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
