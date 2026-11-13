# Statix Data Analyzer

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![GPL-3.0](https://img.shields.io/badge/Licencia-GPL--3.0-blue)](LICENSE)

[Español](#español) · [English](#english)

---

## Español

### Índice

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Desarrollo](#desarrollo)
- [Compilación](#compilación)
- [Formato de sesión .stx](#formato-de-sesión-stx)
- [Flujo de trabajo típico](#flujo-de-trabajo-típico)
- [Límites](#límites)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

### Descripción

**Statix Data Analyzer** es una aplicación de escritorio para **importar, limpiar, analizar y visualizar datos** sin escribir código. Está construida con **React, TypeScript, Vite y Electron**, y combina estadística descriptiva, correlaciones, regresión y aprendizaje automático básico en una interfaz tipo *glassmorphism*.

Todo el procesamiento ocurre en el equipo: no hay servidor, cuentas ni envío de datos.

### Características

**Datos y formatos**

- Importación de `.csv`, `.txt`, `.xlsx`, `.xls`, `.json` y `.data`.
- Detección automática de cabeceras, columnas numéricas y separadores, con selección manual (coma, tabulación, espacio…).
- Exportación del estado actual a `.xlsx`, `.csv`, `.txt`, `.json` y `.data`.

**Limpieza y filtrado**

- **Imputación** de nulos en variables numéricas con media o mediana.
- **Eliminación de filas** con valores nulos o celdas vacías.
- **Borrado de columnas** desde la vista de dataset.
- **Filtros dinámicos** con varias reglas numéricas o de texto (por ejemplo `Edad > 30`, `Departamento contiene "Ventas"`).
- Edición de celdas y renombrado de columnas en tiempo real.

**Estadística y modelos**

- **Estadística descriptiva** por variable numérica: N, media, mediana, desviación estándar, mínimo y máximo.
- **Correlaciones de Pearson y Spearman** con mapa de calor interactivo (escala *coolwarm*).
- **Regresión lineal simple** (`y = mx + b`) y **regresión múltiple** con pesos e intercepto.
- **K-Means** con visualización 2D de los clústeres.
- **Árboles de decisión** para clasificación, con visor SVG interactivo (arrastrar, zoom, plegar nodos).
- **Selector de variables** para cada modelo, con limpieza al vuelo para evitar nulos.

**Visualización**

- Gráficos de dispersión, barras, líneas, área y circulares.
- **Conteo automático**: al elegir una variable categórica en el eje Y, agrupa por X y cuenta.
- **Histogramas** con *bins* ajustables, reglas de Sturges y Scott, asimetría y curva normal superpuesta.
- **Diagramas de caja** con bigotes de Tukey, detección de *outliers*, *jitter* opcional y tabla comparativa; se pueden agrupar por categoría.
- **Línea de tendencia** superpuesta en la dispersión y *tooltips* con valores exactos.
- Renderizado diferido con `useDeferredValue` para mantener la interfaz fluida con miles de filas.

**Sesiones**

- Guardado y restauración en un archivo **`.stx`** que incluye dataset actual, dataset original de respaldo, filtros, configuración de gráficos y modelos entrenados.
- Carga desde el botón **Cargar sesión**, el importador o arrastrando el archivo a la ventana.

### Tecnologías

| Capa | Herramientas |
|---|---|
| Interfaz | React 19, TypeScript, Vite |
| Escritorio | Electron 44, electron-builder |
| Gráficos | Recharts, visor SVG con `react-d3-tree` |
| Datos | PapaParse, SheetJS (`xlsx`), `simple-statistics` |
| Modelos | `ml-kmeans`, `ml-cart`, `ml-regression-multivariate-linear` |
| Estilos | CSS propio (glassmorphism), Lucide React |

### Requisitos

- **Node.js 20** o superior y npm.
- Windows para el empaquetado con `electron-builder` (la configuración incluida genera artefactos de Windows).

### Desarrollo

```bash
git clone https://github.com/alberto2005-coder/statix-desktop-data-analyzer.git
cd statix-desktop-data-analyzer
npm install

npm run dev            # Solo Vite (interfaz en el navegador)
npm start              # Vite + ventana de Electron
npm run lint           # oxlint
```

### Compilación

```bash
npm run build          # TypeScript + Vite → dist/
npm run build:electron # build + electron-builder → release/
```

`installer.iss` es el script de **Inno Setup** para generar el instalador de Windows a partir de la salida de `electron-builder`.

### Formato de sesión .stx

El archivo `.stx` es un contenedor propio (JSON con extensión propia) que guarda:

1. El dataset actual con ediciones, columnas renombradas o eliminadas e imputaciones.
2. Una copia del dataset original para poder restaurarlo.
3. Las reglas de filtrado activas.
4. La configuración de gráficos.
5. Los modelos entrenados: clústeres de K-Means, árbol de decisión y ecuaciones de regresión.

> [!NOTE]
> El formato es específico de Statix: no está pensado para intercambio con R, Python o Excel. Para llevarte los datos a otra herramienta, exporta a CSV, JSON o XLSX.

### Flujo de trabajo típico

1. Importa el archivo y revisa la detección de cabeceras y separador.
2. Limpia: imputa o elimina nulos y descarta columnas que no necesites.
3. Aplica filtros para acotar el análisis.
4. Revisa la estadística descriptiva y el mapa de correlaciones.
5. Prueba un modelo (regresión, K-Means o árbol) y examina sus resultados.
6. Guarda la sesión en `.stx` o exporta los datos limpios.

### Límites

- **Todo cabe en memoria**: datasets muy grandes (cientos de miles de filas) pueden ralentizar la interfaz o agotar la memoria del proceso.
- **Limpieza acotada**: la imputación solo cubre variables numéricas; las categóricas requieren tratamiento manual.
- **Modelos didácticos**: K-Means, árboles y regresiones son implementaciones básicas, sin validación cruzada ni ajuste de hiperparámetros.
- **Sin backend**: no hay colaboración, historial en la nube ni ejecución remota.
- **`.stx` no es un formato estándar**: ábrelo solo con Statix.

### Roadmap

- Pruebas de hipótesis: t de Student, ANOVA de un factor y chi-cuadrado.
- Exportación de informes PDF con gráficos vectoriales y tablas.

### Licencia

**GNU General Public License v3.0 (GPL-3.0)** — consulta [LICENSE](LICENSE). Uso libre, incluido el comercial; las versiones modificadas deben publicarse bajo la misma licencia. © 2026 Alberto Ortiz.

---

## English

### Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Development](#development)
- [Building](#building)
- [The .stx session format](#the-stx-session-format)
- [Typical workflow](#typical-workflow)
- [Limits](#limits)
- [Roadmap](#roadmap)
- [License](#license)

### Overview

**Statix Data Analyzer** is a desktop app to **import, clean, analyse and visualise data** without writing code. Built with **React, TypeScript, Vite and Electron**, it combines descriptive statistics, correlations, regression and basic machine learning in a glassmorphism interface.

All processing happens on your machine: no server, accounts or data uploads.

### Features

**Data and formats**

- Import `.csv`, `.txt`, `.xlsx`, `.xls`, `.json` and `.data`.
- Automatic detection of headers, numeric columns and separators, with manual override (comma, tab, space…).
- Export the current state to `.xlsx`, `.csv`, `.txt`, `.json` and `.data`.

**Cleaning and filtering**

- **Imputation** of nulls in numeric variables using the mean or median.
- **Row removal** for rows with nulls or empty cells.
- **Column deletion** from the dataset view.
- **Dynamic filters** with multiple numeric or text rules (e.g. `Age > 30`, `Department contains "Sales"`).
- In-place cell editing and column renaming.

**Statistics and models**

- **Descriptive statistics** per numeric variable: N, mean, median, standard deviation, min and max.
- **Pearson and Spearman correlations** with an interactive heatmap (*coolwarm* scale).
- **Simple linear regression** (`y = mx + b`) and **multiple regression** with weights and intercept.
- **K-Means** with a 2D cluster visualisation.
- **Decision trees** for classification, with an interactive SVG viewer (drag, zoom, collapse nodes).
- **Variable selector** per model, with on-the-fly cleaning to avoid nulls.

**Visualisation**

- Scatter, bar, line, area and pie charts.
- **Automatic counting**: picking a categorical variable on the Y axis groups by X and counts.
- **Histograms** with adjustable bins, Sturges and Scott rules, skewness and an overlaid normal curve.
- **Box plots** with Tukey whiskers, outlier detection, optional jitter and a comparison table; can be grouped by category.
- **Trend line** overlaid on the scatter plot and tooltips with exact values.
- Deferred rendering with `useDeferredValue` to keep the UI fluid with thousands of rows.

**Sessions**

- Save and restore a **`.stx`** file containing the current dataset, the original backup, filters, chart settings and trained models.
- Load it from **Load session**, the importer or by dragging the file onto the window.

### Tech stack

| Layer | Tools |
|---|---|
| UI | React 19, TypeScript, Vite |
| Desktop | Electron 44, electron-builder |
| Charts | Recharts, SVG viewer via `react-d3-tree` |
| Data | PapaParse, SheetJS (`xlsx`), `simple-statistics` |
| Models | `ml-kmeans`, `ml-cart`, `ml-regression-multivariate-linear` |
| Styling | Custom CSS (glassmorphism), Lucide React |

### Requirements

- **Node.js 20** or later and npm.
- Windows for packaging with `electron-builder` (the included config produces Windows artefacts).

### Development

```bash
git clone https://github.com/alberto2005-coder/statix-desktop-data-analyzer.git
cd statix-desktop-data-analyzer
npm install

npm run dev            # Vite only (UI in the browser)
npm start              # Vite + Electron window
npm run lint           # oxlint
```

### Building

```bash
npm run build          # TypeScript + Vite → dist/
npm run build:electron # build + electron-builder → release/
```

`installer.iss` is the **Inno Setup** script that turns the `electron-builder` output into a Windows installer.

### The .stx session format

`.stx` is a custom container (JSON with its own extension) that stores:

1. The current dataset with edits, renamed or deleted columns and imputations.
2. A copy of the original dataset for restoration.
3. Active filter rules.
4. Chart configuration.
5. Trained models: K-Means clusters, decision tree and regression equations.

> [!NOTE]
> The format is Statix-specific: it is not meant for exchange with R, Python or Excel. To move data elsewhere, export to CSV, JSON or XLSX.

### Typical workflow

1. Import the file and check header and separator detection.
2. Clean: impute or drop nulls and discard unneeded columns.
3. Apply filters to narrow the analysis.
4. Review descriptive statistics and the correlation heatmap.
5. Try a model (regression, K-Means or tree) and inspect the results.
6. Save the session as `.stx` or export the cleaned data.

### Limits

- **Everything fits in memory**: very large datasets (hundreds of thousands of rows) can slow the UI down or exhaust the process memory.
- **Scoped cleaning**: imputation only covers numeric variables; categorical ones need manual handling.
- **Teaching-grade models**: K-Means, trees and regressions are basic implementations, with no cross-validation or hyperparameter tuning.
- **No backend**: no collaboration, cloud history or remote execution.
- **`.stx` is not a standard format**: open it with Statix only.

### Roadmap

- Hypothesis tests: Student's t, one-way ANOVA and chi-square.
- PDF report export with vector charts and tables.

### License

**GNU General Public License v3.0 (GPL-3.0)** — see [LICENSE](LICENSE). Free use, including commercial; modified versions must be published under the same license. © 2026 Alberto Ortiz.
