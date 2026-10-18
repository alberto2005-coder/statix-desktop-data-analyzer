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

Este proyecto está bajo la **Licencia Personalizada de Alberto Ortiz**.
Consulta el archivo `LICENSE` para más detalles.

**Resumen:**
- ✅ Uso no comercial permitido
- ❌ No se permite comercialización sin autorización
- ⚠️ Los forks deben mantener atribución visible
- 📌 Debe incluir marca de agua del original
