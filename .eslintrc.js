// .eslintrc.js
module.exports = {
  // Extiende configuraciones recomendadas para React
  extends: [
    'react-app', // Configuración por defecto de Create React App (incluye React y JSX)
    'react-app/jest' // Para pruebas con Jest, si las usas
  ],
  // Define las variables globales que ESLint debe reconocer
  globals: {
    __app_id: 'readonly',
    __firebase_config: 'readonly',
    __initial_auth_token: 'readonly',
  },
  // Puedes añadir reglas personalizadas si lo necesitas
  rules: {
    // Ejemplo: permitir el uso de console.log en desarrollo
    // 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Puedes ajustar otras reglas aquí
  },
};
