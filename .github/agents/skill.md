# Skill: Rediseño Estético Minimalista y Moderno (Rick & Morty Theme)

Esta skill define la guía de diseño visual, paleta de colores, tipografía, componentes UI y el plan de tareas exclusivo para el diseño estético de la aplicación. 

> **Regla de oro para el agente de IA:** NO modificar ni agregar lógica de negocio, hooks, estados o funcionalidades. Únicamente aplicar estilos CSS/Tailwind, modificar la estructura visual y aplicar maquetación UI.

---

## 1. Guía de Estilo Visual

### Paleta de Colores
Inspirada directamente en el logo oficial de Rick and Morty, adaptada para interfaces oscuras (Dark Mode) minimalistas:

* **Fondo Principal (`Bg Dark`):** `#090A0F` o `#000000` (Negro profundo/Espacial)
* **Superficies / Cards (`Surface Dark`):** `#121820` o `#161D26` (Gris oscuro azulado sutil)
* **Bordes / Detalles Secundarios (`Portal Green`):** `#A6E22E` o `#87D500` (Verde Neón Tóxico / Borde del logo)
* **Color Primario / Highlights (`Portal Blue`):** `#00B5D8` o `#00A8E8` (Azul Cian / Interior del logo)
* **Texto Principal:** `#F8F9FA` (Blanco suave para alta legibilidad)
* **Texto Secundario:** `#94A3B8` (Gris claro para subtítulos e iconos secundarios)

---

## 2. Definición de Diseño UI/UX

* **Estilo General:** Minimalista, limpio, con contraste alto pero elegante.
* **Efectos de Brillo (Glow Effects):** Sombras suaves tipo neón (`box-shadow: 0 0 15px rgba(135, 213, 0, 0.2)`) en estados `:hover` o elementos activos.
* **Bordes y Radio:** Bordes sutiles de `1px` con opacidad reducida (`rgba(135, 213, 0, 0.3)`), bordes redondeados modernos (`rounded-xl` / `12px`).
* **Tipografía:**
  * **Títulos / Headers:** Sans-serif moderna, de peso fuerte (Bold/ExtraBold), con espaciado amplio (`tracking-wide`).
  * **Cuerpo:** Sans-serif limpia (Inter, Roboto o System Font) para mantener el enfoque minimalista y fácil de leer.

---

## 3. Lista de Tareas para el Agente IA (`TODO Tasks`)

El agente de IA debe seguir estas tareas en orden secuencial sin tocar la funcionalidad de la app:

- [x] **Tarea 1: Configurar Variables Globale / Tema**
  - Definir las variables de color CSS o la configuración de Tailwind (`tailwind.config.js`) con la paleta: `bg-space`, `portal-blue`, `portal-green`, `surface-dark`.
  - Aplicar el fondo global `#090A0F` y el color de texto por defecto `#F8F9FA` al `body` / contenedor principal.

- [x] **Tarea 2: Rediseñar la Encabezado / Navbar**
  - Convertir el encabezado en un componente flotante o fijo con fondo semi-transparente (`backdrop-blur-md`).
  - Añadir un toque de color `Portal Blue` al título o logo de la app.
  - Asegurar que los botones de navegación tengan efectos hover sencillos con acento `Portal Green`.

- [x] **Tarea 3: Estilizado de Tarjetas y Contenedores (Cards)**
  - Reemplazar fondos blancos o grises claros por superficies oscuras elegantes (`#121820`).
  - Añadir bordes finos con tinte neón muy discreto.
  - Implementar transiciones suaves (`transition: all 0.3s ease`) en interacciones al pasar el cursor.

- [x] **Tarea 4: Botones e Inputs**
  - **Botones Primarios:** Fondo `Portal Blue` con texto oscuro/negro para alto contraste, o fondo transparente con borde `Portal Green` y efecto glow al hacer hover.
  - **Inputs / Campos de texto:** Fondo oscuro, sin bordes pesados, mostrando un anillo (ring) de color `Portal Blue` al enfocar (`:focus`).

- [x] **Tarea 5: Detalles Visuales y Espaciado**
  - Incrementar el espacio en blanco (paddings y margins) para reforzar el aspecto minimalista.
  - Rediseñar modales, badges, footers y barras de desplazamiento (scrollbars) usando la misma línea gráfica.