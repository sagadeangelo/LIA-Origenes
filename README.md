# 🏰 LIA Orígenes

### Atlas histórico de apellidos · Investigación documental · Genealogía asistida por IA

**Explora el pasado. Descubre las fuentes. Investiga tus orígenes.**

LIA Orígenes es una plataforma de investigación histórica y genealógica que combina un atlas interactivo de apellidos, bibliotecas documentales, inteligencia artificial local y herramientas de exploración histórica.

Su objetivo es facilitar el acceso a información sobre el origen, la evolución y la presencia documental de los apellidos, conectando al usuario con fuentes históricas que pueden servir como punto de partida para una investigación familiar.

El proyecto forma parte del ecosistema **LIA-Tech**.

---

## ✨ Características principales

### 🗺️ Atlas histórico de apellidos

- Exploración geográfica mediante un mapa interactivo de inspiración ibérica.
- Búsqueda de apellidos y variantes ortográficas.
- Fichas históricas con referencias consultables.
- Contexto regional y orientación para investigaciones posteriores.
- Catálogo inicial con apellidos como **Tovar, Tobar y Amaral**.

### 📚 Biblioteca documental inteligente

Un entorno para organizar, consultar y analizar documentos históricos.

- Importación de archivos PDF, DOCX, TXT y Markdown.
- Extracción y segmentación del contenido.
- Conservación de referencias a páginas, párrafos y fragmentos.
- Búsqueda semántica mediante embeddings.
- Consulta de pasajes relacionados con apellidos, personas y lugares.
- Acceso a los documentos originales.
- Detección básica de entidades históricas y geográficas.
- Prevención de importaciones duplicadas mediante SHA-256.

La biblioteca utiliza PostgreSQL con pgvector para almacenar y recuperar información documental.

### 🤖 Inteligencia artificial local

LIA Orígenes integra herramientas de IA que permiten investigar documentos sin depender exclusivamente de servicios externos.

**Tecnologías utilizadas:**

- Ollama para ejecutar modelos localmente.
- EmbeddingGemma para representaciones vectoriales.
- pgvector para búsquedas por similitud.
- FastAPI para la orquestación de consultas y procesamiento documental.

La búsqueda semántica permite localizar pasajes relacionados por significado, incluso cuando no contienen exactamente las mismas palabras de la consulta.

### 🏛️ Investigación en catálogos históricos

El proyecto incorpora conectores para ampliar la exploración de información histórica.

**Wikidata**

- Consulta de información estructurada sobre apellidos.
- Identificación de propiedades y referencias disponibles.
- Diferenciación entre metadatos catalográficos y evidencias documentales.

**Internet Archive**

- Búsqueda de candidatos bibliográficos relacionados con apellidos.
- Filtrado de resultados judiciales modernos no pertinentes.
- Clasificación automática de documentos.
- Evaluación de relevancia histórica y genealógica.
- Identificación de títulos antiguos, mayorazgos y documentos históricos.
- Tratamiento de determinados errores de reconocimiento óptico de caracteres (OCR).
- Enlaces al registro original.

El conector y su clasificador cuentan con pruebas automatizadas y validaciones sobre resultados reales. Su integración visual en React continúa en desarrollo.

### 🧭 Rutas de investigación histórica

La aplicación permite explorar posibles líneas de investigación geográfica a partir de un apellido y un país de destino.

El sistema identifica referencias documentales que pueden ayudar a orientar búsquedas sobre presencia histórica, desplazamientos y asentamientos.

**Importante:** una coincidencia entre apellido y lugar no demuestra por sí misma una migración familiar.

### 🛡️ Heráldica y documentos personalizados

LIA Orígenes incorpora un flujo de demostración para generar documentos históricos y recursos gráficos.

| Producto | Contenido | Precio de demostración |
|---|---|---|
| Pergamino histórico | Informe histórico en PDF | $30 MXN |
| Legado heráldico | Informe ampliado y escudo artístico vectorial | $69 MXN |

El sistema permite simular órdenes, pagos aprobados y descargas.

Los escudos generados son representaciones artísticas. No deben interpretarse automáticamente como blasones históricos pertenecientes a una familia concreta.

---

## 🏗️ Arquitectura tecnológica

| Capa | Tecnología | Función |
|---|---|---|
| Frontend | React 19 + Vite 7 | Interfaz interactiva |
| Backend | Python + FastAPI | API y servicios |
| Base comercial | SQLite | Órdenes y demostraciones |
| Base documental | PostgreSQL 16 | Almacenamiento histórico |
| Búsqueda vectorial | pgvector | Recuperación semántica |
| Inteligencia artificial | Ollama | Procesamiento local |
| Embeddings | EmbeddingGemma | Representación de textos |
| Contenedores | Docker Compose | Infraestructura documental |
| Fuentes externas | Wikidata e Internet Archive | Exploración de catálogos |

### Flujo general

```text
                    LIA ORÍGENES
                         |
                React + Vite
                         |
                   FastAPI
                         |
       +-----------------+------------------+
       |                 |                  |
 Atlas de apellidos  Biblioteca         Documentos
       |             documental          comerciales
       |                 |                  |
 Catálogo histórico  PostgreSQL          SQLite
       |             + pgvector              |
       |                 |              PDF / SVG
       |                Ollama
       |                 |
       |          Búsqueda semántica
       |
 Conectores históricos
       |
  +----+-------------+
  |                  |
Wikidata       Internet Archive
```

---

## 🚀 Instalación local

### Requisitos

- Windows 11 o entorno compatible.
- Python 3.12.
- Node.js 22.12 o superior.
- npm.
- Docker Desktop para la biblioteca documental.
- Ollama para la búsqueda semántica local.

### 1. Clonar el repositorio

```powershell
git clone https://github.com/sagadeangelo/LIA-Origenes.git

cd LIA-Origenes

git switch work/mvp-lia-origenes
```

### 2. Verificar el proyecto

```powershell
.\scripts\Verificar-LIA-Origenes.ps1
```

### 3. Iniciar el MVP

```powershell
.\scripts\Iniciar-LIA-Origenes.ps1
```

Abrir en el navegador:

**http://127.0.0.1:8113**

### 4. Iniciar la biblioteca documental

Con Docker Desktop y Ollama activos:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\Iniciar-Investigacion.ps1"
```

El iniciador prepara la infraestructura documental, solicita la contraseña de PostgreSQL cuando corresponde e inicia los servicios necesarios.

La primera ejecución puede requerir descargar imágenes y modelos.

---

## 🔌 API

El backend expone servicios HTTP para consultar el atlas, gestionar documentos y explorar fuentes.

| Endpoint | Descripción |
|---|---|
| `GET /api/health` | Estado del servidor |
| `GET /api/catalog` | Catálogo de productos y apellidos |
| `GET /api/surnames?q=Tovar` | Consulta de apellido |
| `GET /api/research/sources` | Biblioteca de fuentes |
| `GET /api/research/search` | Búsqueda semántica |
| `GET /api/research/route` | Ruta de investigación |
| `GET /api/research/internet-archive` | Candidatos bibliográficos de Internet Archive |

Ejemplo:

```http
GET /api/research/internet-archive?apellido=Tovar&limite=10
```

La respuesta permite consultar los registros y sus clasificaciones automáticas.

La disponibilidad de ciertos endpoints depende de la configuración de los servicios locales.

---

## 🧪 Calidad y validación

La investigación documental se desarrolla mediante pruebas automatizadas y verificaciones sobre resultados reales.

**Última validación local reportada del clasificador:**

- 68 pruebas aprobadas.
- 8 subpruebas aprobadas.
- 1 prueba omitida.
- Sin fallos de clasificación en los seis documentos localizados durante la validación real.

Los escenarios incluyen:

- Detección de mayorazgos y documentos de linaje.
- Identificación de documentos históricos antiguos.
- Clasificación de coincidencias nominales.
- Exclusión de registros judiciales modernos.
- Tratamiento de determinados errores OCR.
- Prevención de inferencias genealógicas no sustentadas.

Los resultados corresponden a la validación local del desarrollo y no constituyen una garantía de precisión histórica universal.

---

## 🔒 Privacidad y responsabilidad histórica

LIA Orígenes prioriza una investigación documental transparente.

**Principios del proyecto:**

1. Diferenciar hechos documentados de hipótesis.
2. Identificar las fuentes originales cuando estén disponibles.
3. No presentar coincidencias de apellido como pruebas de parentesco.
4. No atribuir automáticamente escudos a personas o familias.
5. Mantener el procesamiento documental local cuando sea posible.
6. Reconocer los límites de la clasificación automática.

La presencia de un apellido en un libro, registro o archivo **no demuestra una relación familiar directa**.

Las conclusiones genealógicas requieren contrastar documentos primarios y establecer vínculos verificables entre personas y generaciones.

---

## 🛣️ Hoja de ruta

| Etapa | Estado |
|---|---|
| MVP del atlas histórico | Implementado |
| Generación de informes PDF y SVG | Implementado |
| Simulación de órdenes y pagos | Implementado |
| Biblioteca documental local | Implementado |
| Búsqueda semántica con IA local | Implementado |
| Integración de Wikidata | Implementado |
| Conector Internet Archive | Validado localmente |
| Clasificación documental avanzada | Validada localmente |
| Biblioteca histórica interactiva en React | En desarrollo |
| Ampliación de fuentes archivísticas | Planificado |
| Investigación migratoria personalizada avanzada | Planificado |
| Árboles familiares sustentados en documentos | Visión futura |

---

## 🌎 Visión del proyecto

LIA Orígenes busca evolucionar hacia una plataforma que conecte:

**Apellidos → Documentos → Personas → Lugares → Periodos históricos → Hipótesis genealógicas verificables.**

La finalidad es que cada descubrimiento pueda conducir a una fuente, cada fuente a una nueva pregunta y cada investigación a una reconstrucción histórica más fundamentada.

---

## 👨‍💻 Desarrollo

**Proyecto:** LIA Orígenes  
**Ecosistema:** LIA-Tech  
**Repositorio:** [sagadeangelo/LIA-Origenes](https://github.com/sagadeangelo/LIA-Origenes)  
**Rama de desarrollo:** `work/mvp-lia-origenes`

### Estado

Proyecto en desarrollo activo. Algunas funciones están disponibles en modo demostración y otras requieren servicios locales adicionales.

La licencia y las condiciones de contribución se definirán conforme avance el proyecto.

---

**LIA Orígenes — La historia comienza con una pregunta.**
