  /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./src/**/*.{js,jsx,ts,tsx}", // Esto le dice a Tailwind que escanee todos los archivos JS, JSX, TS, TSX en la carpeta src
        "./public/index.html", // También escanea tu archivo HTML principal
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }