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
- **Selector de Variables:** Elige manualmente qué variable asignar al Eje X (independiente) y al Eje Y (dependiente) para tus modelos.

### 4. Visualización Avanzada
- **Renderizado Optimizado (Carga Diferida):** La interfaz utiliza `useDeferredValue` de React 18+ para mantener los controles de selección siempre fluidos incluso cuando se procesan y grafican miles de registros, mostrando un elegante overlay de "Actualizando Gráfico..." en segundo plano.
- **Gráficos Combinados (Scatter + Trend):** Visualiza la relación entre variables a través de un gráfico de dispersión (Scatter Plot) que superpone la línea de tendencia de la regresión calculada.
- **Gráficos Inteligentes con Conteo Automático:** Cambia en un clic entre gráficos de Dispersión, Barras, Líneas, Área y Circulares (Pie Charts). Si seleccionas variables categóricas (texto) para el Eje Y en gráficos de Barras/Líneas/Área/Circulares, el sistema **agrupa automáticamente los datos por el Eje X y realiza un conteo**, permitiendo generar gráficos de cantidad sin necesidad de procesar los datos previamente.
- **Tooltips Interactivos:** Inspecciona los valores numéricos exactos de cada registro directamente sobre las gráficas.

## 💡 Ideas para Implementar a Futuro

Para convertir esta aplicación en una verdadera alternativa completa a herramientas complejas de análisis de datos, se podrían implementar las siguientes funciones en versiones futuras:
- **Modelos de Machine Learning Complejos:** Integrar librerías de regresión múltiple, árboles de decisión o clustering (K-Means).
- **Guardado de Sesiones:** Permitir guardar el proyecto completo con los datos editados, columnas renombradas y modelos entrenados en un archivo propietario (ej. `.stx`).
- **Gráficos Dinámicos Extra:** Boxplots (Diagramas de caja y bigotes) e Histogramas avanzados con tamaño de *bin* ajustable.

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
