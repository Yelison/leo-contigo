# Leoaventura / LeoContigo

Aplicación independiente para aprender a leer en español mediante ejercicios, cuentos, dictados y una ruta progresiva.

## Ver la aplicación publicada

La versión web está disponible en
[yelison.github.io/leo-contigo](https://yelison.github.io/leo-contigo/). Los
cambios aprobados en las ramas `work` y `main` se publican automáticamente con
GitHub Pages.

## Ejecutar en Windows

1. Instala [Node.js LTS](https://nodejs.org/) si todavía no lo tienes.
2. Extrae todo el contenido del ZIP.
3. Haz doble clic en `iniciar-leoaventura.bat`.
4. La primera ejecución instala los componentes necesarios y luego abre la aplicación en el navegador.

El progreso y la voz elegida se guardan únicamente en el navegador de esa computadora. La aplicación no necesita una cuenta de ChatGPT ni una base de datos externa.

## Propuestas de producto

- [Sistema de recompensas por estrellas](docs/propuesta-sistema-recompensas.md):
  diseño para revisión antes de iniciar su implementación.

## Ejecutar con comandos

```bash
npm install
npm start
```

## Crear una versión compilada

```bash
npm run build
npm run preview
```
