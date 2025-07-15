import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importa tu componente principal App

// Encuentra el elemento raíz en tu HTML
const rootElement = document.getElementById('root');

// Asegúrate de que el elemento raíz exista antes de intentar renderizar
if (rootElement) {
  // Crea una raíz de React 18 y renderiza tu componente App
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("El elemento con ID 'root' no se encontró en el documento HTML. No se pudo renderizar la aplicación React.");
}
