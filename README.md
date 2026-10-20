# StatixPro - Data Analysis Application

StatixPro es una potente aplicación de escritorio construida con **React, Vite y Electron**, diseñada para ofrecer una experiencia fluida y profesional en el análisis de datos. Inspirada en herramientas estadísticas avanzadas como R, permite a los usuarios manipular y analizar datos rápidamente a través de una interfaz moderna y atractiva.

## 🚀 Características Principales

### 1. Gestión de Datos y Formatos
- **Múltiples Formatos Soportados:** Importa fácilmente datasets en formato `.csv`, `.txt`, `.xlsx`, `.xls`, **`.json`** y formatos genéricos **`.data`**.
- **Detección Automática:** Detección inteligente de cabeceras, columnas numéricas y separadores (con opción a selección manual para coma, tabulación, espacio, etc.).
- **Exportación Multi-Formato:** Exporta instantáneamente el estado actual de tus datos limpios, filtrados y editados a formato **Excel (.xlsx)**, **CSV (.csv)**, **Texto (.txt)**, **JSON (.json)** o binario genérico **(.data)** mediante un selector integrado en la barra de navegación superior.

### 2. Limpieza de Datos y Filtrado (Data Cleaning)
- **Imputación de Datos (Data Imputation):** En lugar de solo eliminar registros, rellena automáticamente los valores nulos (`NaN`) o celdas vacías de tus variables numéricas utilizando la **Media (Promedio)** o la **Mediana** con un solo clic.
- **Eliminar Nulos:** Botón dedicado para buscar y eliminar automáticamente todas las filas que contengan valores nulos (NaN) o campos vacíos.
- **Gestión de Columnas:** Elimina rápidamente cualquier variable o columna innecesaria de tu modelo haciendo clic en el icono de la papelera en la vista de Dataset.
- **Filtrado Avanzado Dinámico:** Añade reglas múltiples (ej. `Edad > 30`, `Departamento contiene "Ventas"`) para filtrar tus datos numéricamente o por texto, modificando instantáneamente el dataset.

### 3. Modelado y Estadística (Machine Learning)
- **Estadística Descriptiva Automática:** Calcula y muestra automáticamente, para todas las variables numéricas, estadísticas clave:
  - Número de valores válidos (N)
  - Media (Promedio)
  - Mediana
  - Desviación Estándar
  - Valor Mínimo y Máximo
- **Análisis de Correlación y Mapa de Calor:** Calcula automáticamente los coeficientes de correlación de Pearson y Spearman entre todas las variables numéricas. Incluye un **Mapa de Calor (Heatmap) interactivo** que utiliza la escala de colores estándar científica (*coolwarm*: azul para negativo, blanco para neutro, rojo para positivo) para una visualización rápida de relaciones fuertes.
- **Regresión Lineal Integrada:** Calcula instantáneamente modelos de regresión lineal simple (`y = mx + b`) sobre los datos.
- **Modelos Avanzados de Machine Learning:** Nueva sección dedicada a algoritmos predictivos:
  - **K-Means Clustering:** Algoritmo no supervisado para encontrar patrones y agrupaciones ocultas en tus datos, con visualización gráfica interactiva de los clústeres en 2D.
  - **Árboles de Decisión (Clasificación):** Sistema de reglas lógicas para predecir categorías o clasificaciones. Incluye un **visor interactivo vectorial D3 (SVG)** que genera un organigrama navegable en tiempo real (puedes arrastrar, hacer zoom y colapsar/expandir nodos condicionales).
  - **Regresión Lineal Múltiple:** Modelo predictivo numérico basado en todas las variables independientes de la base de datos, generando instantáneamente la fórmula matemática predictiva con pesos y base (intercept).
- **Selector Inteligente de Variables:** Elige manualmente qué variables asignar al modelo, con limpieza de datos al vuelo para evitar bloqueos por nulos.

### 4. Visualización Avanzada
- **Renderizado Optimizado (Carga Diferida):** La interfaz utiliza `useDeferredValue` de React 18+ para mantener los controles de selección siempre fluidos incluso cuando se procesan y grafican miles de registros, mostrando un elegante overlay de "Actualizando Gráfico..." en segundo plano.
- **Gráficos Combinados (Scatter + Trend):** Visualiza la relación entre variables a través de un gráfico de dispersión (Scatter Plot) que superpone la línea de tendencia de la regresión calculada.
- **Gráficos Inteligentes con Conteo Automático:** Cambia en un clic entre gráficos de Dispersión, Barras, Líneas, Área y Circulares (Pie Charts). Si seleccionas variables categóricas (texto) para el Eje Y en gráficos de Barras/Líneas/Área/Circulares, el sistema **agrupa automáticamente los datos por el Eje X y realiza un conteo**, permitiendo generar gráficos de cantidad sin necesidad de procesar los datos previamente.
- **Histogramas Dinámicos con *Bins* Ajustables y Curva Normal:** Permite explorar la distribución empírica de cualquier variable continua con selector dinámico de intervalos (*bins*) vía slider o entrada numérica, reglas automáticas clásicas de **Sturges** y **Scott**, cálculo de ancho de bin ($\Delta$), asimetría (skewness), y superposición de la **Campana de Gauss (Curva Normal teórica)** generada mediante su función de densidad de probabilidad.
- **Diagramas de Caja y Bigotes (Boxplots con Tukey Whiskers):** Representación científica de resumen de 5 números (Mínimo, Q1, Mediana, Q3, Máximo, Rango Intercuartílico IQR y Media). Permite analizar la variable individualmente o **agruparla por categorías** (ej. Salario según Departamento o Ventas según Campaña), detección interactiva de valores atípicos (*outliers*), capa opcional de dispersión de puntos (*jitter*), y tabla estadística comparativa.
- **Tooltips Interactivos:** Inspecciona los valores numéricos exactos de cada registro directamente sobre las gráficas.

### 5. Guardado y Restauración de Sesiones (.stx)
- **Formato Propietario de Sesión Statix (.stx):** Guarda tu proyecto completo en cualquier momento con un solo clic. El archivo `.stx` almacena íntegramente:
  - El dataset actual con todas sus modificaciones (ediciones de celdas en tiempo real, columnas renombradas, columnas eliminadas, imputaciones y limpieza).
  - El dataset original de respaldo (permitiendo restaurar en cualquier instante).
  - Reglas de filtrado activas.
  - Configuración de gráficos y visualizaciones.
  - **Modelos entrenados de Machine Learning:** Clústeres de K-Means calculados, Árbol de Decisión generado y Ecuaciones de Regresión Lineal Múltiple.
- **Carga Rápida y Arrastrar y Soltar:** Abre archivos `.stx` a través del botón dedicado "Cargar Sesión", el selector de importar o simplemente arrastrando el archivo a la aplicación para reanudar el análisis instantáneamente.

## 💡 Ideas para Implementar a Futuro

Para continuar expandiendo las capacidades de StatixPro, se contemplan las siguientes características:
- **Pruebas de Hipótesis Paramétricas y No Paramétricas:** Integración de tests estadísticos (t de Student para muestras independientes/pareadas, ANOVA de un factor y prueba de Chi-cuadrado).
- **Generación de Reportes PDF:** Exportación directa de informes analíticos completos con gráficos vectoriales y tablas descriptivas formateadas para impresión y presentaciones.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React, TypeScript, Vite
- **Desktop Packaging:** Electron, Electron-Builder
- **Visualización:** Recharts
- **Parsing y Procesamiento:** PapaParse (CSVs), SheetJS / xlsx (Excel), Simple-Statistics (Regresiones)
- **UI:** CSS Vanilla con diseño Glassmorphism, Lucide React (Iconos)

## 📦 Desarrollo y Compilación

1. **Instalación:**
   ```bash
   npm install
   ```

2. **Iniciar Entorno de Desarrollo:**
   *(Inicia tanto el servidor Vite de fondo como la ventana nativa de Electron)*
   ```bash
   npm start
   ```

3. **Compilar para Producción (.exe):**
   *(Prepara el binario listo para ser empaquetado por herramientas como Inno Setup)*
   ```bash
   npm run build:electron
   ```

## Licencia

Este proyecto está bajo la **Licencia GPL-3.0**.
Consulta el archivo `LICENSE` para más detalles.

**Resumen:**
- ✅ Uso libre, incluso con fines comerciales
- ⚠️ Si distribuyes copias o versiones modificadas, publica su código fuente bajo la misma licencia (copyleft)
- © Copyright (C) 2026 Alberto Ortiz

---

# English Version

**StatixPro** is a powerful desktop application built with **React, Vite and Electron**, designed to deliver a smooth, professional data-analysis experience. Inspired by advanced statistical tools such as R, it lets users manipulate and analyze data quickly through a modern, attractive interface.

## 🚀 Key Features

### 1. Data and Format Management
- **Multiple Formats Supported:** Easily import datasets in `.csv`, `.txt`, `.xlsx`, `.xls`, **`.json`** and generic **`.data`** formats.
- **Automatic Detection:** Smart detection of headers, numeric columns and separators (with a manual option for comma, tab, space, etc.).
- **Multi-Format Export:** Instantly export the current state of your cleaned, filtered and edited data to **Excel (.xlsx)**, **CSV (.csv)**, **Text (.txt)**, **JSON (.json)** or generic binary **(.data)** using a selector built into the top navigation bar.

### 2. Data Cleaning and Filtering
- **Data Imputation:** Instead of just deleting records, automatically fills null (`NaN`) values or empty cells of your numeric variables using the **Mean** or the **Median** with a single click.
- **Remove Nulls:** A dedicated button to find and automatically delete every row containing null values (NaN) or empty fields.
- **Column Management:** Quickly remove any unnecessary variable or column from your model by clicking the trash icon in the Dataset view.
- **Advanced Dynamic Filtering:** Add multiple rules (e.g. `Age > 30`, `Department contains "Sales"`) to filter your data numerically or by text, modifying the dataset instantly.

### 3. Modeling and Statistics (Machine Learning)
- **Automatic Descriptive Statistics:** Automatically calculates and displays, for all numeric variables, key statistics:
  - Number of valid values (N)
  - Mean
  - Median
  - Standard Deviation
  - Minimum and Maximum values
- **Correlation Analysis and Heatmap:** Automatically computes Pearson and Spearman correlation coefficients between all numeric variables. Includes an **interactive Heatmap** using the standard scientific color scale (*coolwarm*: blue for negative, white for neutral, red for positive) for a quick view of strong relationships.
- **Built-in Linear Regression:** Instantly computes simple linear regression models (`y = mx + b`) over the data.
- **Advanced Machine Learning Models:** A dedicated section for predictive algorithms:
  - **K-Means Clustering:** An unsupervised algorithm to find hidden patterns and groupings in your data, with an interactive 2D visualization of the clusters.
  - **Decision Trees (Classification):** A logical rule system to predict categories or classifications. Includes an **interactive D3 vector viewer (SVG)** that generates a navigable flowchart in real time (you can drag, zoom and collapse/expand conditional nodes).
  - **Multiple Linear Regression:** A numeric predictive model based on all independent variables in the database, instantly generating the predictive mathematical formula with weights and intercept.
- **Smart Variable Selector:** Manually choose which variables to assign to the model, with on-the-fly data cleaning to avoid null-related lockups.

### 4. Advanced Visualization
- **Optimized Rendering (Deferred Loading):** The interface uses React 18+'s `useDeferredValue` to keep selection controls fluid even when thousands of records are processed and plotted, showing an elegant "Updating Chart..." overlay in the background.
- **Combined Charts (Scatter + Trend):** Visualize the relationship between variables through a scatter plot that overlays the trend line of the computed regression.
- **Smart Charts with Automatic Counting:** Switch with one click between Scatter, Bar, Line, Area and Pie charts. If you select categorical (text) variables for the Y axis on Bar/Line/Area/Pie charts, the system **automatically groups the data by the X axis and counts it**, letting you produce quantity charts without preprocessing the data.
- **Dynamic Histograms with Adjustable Bins and Normal Curve:** Explore the empirical distribution of any continuous variable with a dynamic bin selector via slider or numeric input, classic automatic **Sturges** and **Scott** rules, bin-width calculation ($\Delta$), skewness, and an overlaid **Gaussian bell (theoretical Normal curve)** generated from its probability density function.
- **Box-and-Whisker Plots (Boxplots with Tukey Whiskers):** Scientific 5-number summary representation (Min, Q1, Median, Q3, Max, Interquartile Range IQR and Mean). Lets you analyze the variable individually or **group it by categories** (e.g. Salary by Department or Sales by Campaign), interactive outlier detection, an optional point-dispersion layer (*jitter*), and a comparative statistics table.
- **Interactive Tooltips:** Inspect the exact numeric values of each record directly on the charts.

### 5. Session Save and Restore (.stx)
- **Statix Proprietary Session Format (.stx):** Save your whole project at any time with a single click. The `.stx` file stores:
  - The current dataset with all its modifications (real-time cell edits, renamed columns, deleted columns, imputations and cleaning).
  - The original backup dataset (allowing restoration at any time).
  - Active filter rules.
  - Chart and visualization settings.
  - **Trained Machine Learning models:** Computed K-Means clusters, generated Decision Tree and Multiple Linear Regression equations.
- **Fast Loading and Drag-and-Drop:** Open `.stx` files through the dedicated "Load Session" button, the import selector, or simply by dragging the file onto the application to resume analysis instantly.

## 💡 Future Ideas

To keep expanding StatixPro's capabilities, the following features are planned:
- **Parametric and Non-Parametric Hypothesis Tests:** Integration of statistical tests (Student's t for independent/paired samples, one-way ANOVA and Chi-square test).
- **PDF Report Generation:** Direct export of complete analytical reports with vector charts and formatted descriptive tables for printing and presentations.

## 🛠️ Technologies Used

- **Frontend:** React, TypeScript, Vite
- **Desktop Packaging:** Electron, Electron-Builder
- **Visualization:** Recharts
- **Parsing and Processing:** PapaParse (CSVs), SheetJS / xlsx (Excel), Simple-Statistics (Regressions)
- **UI:** Vanilla CSS with Glassmorphism design, Lucide React (icons)

## 📦 Development and Build

1. **Install:**
   ```bash
   npm install
   ```

2. **Start the Development Environment:**
   *(Starts both the background Vite server and the native Electron window)*
   ```bash
   npm start
   ```

3. **Build for Production (.exe):**
   *(Prepares the binary to be packaged by tools such as Inno Setup)*
   ```bash
   npm run build:electron
   ```

## License

This project is licensed under the **GPL-3.0 License**.
See the `LICENSE` file for details.

**Summary:**
- ✅ Free use, including commercial purposes
- ⚠️ If you distribute copies or modified versions, publish their source code under the same license (copyleft)
- © Copyright (C) 2026 Alberto Ortiz
