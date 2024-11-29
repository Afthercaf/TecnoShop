import React from 'react';

const ReintentarOnboarding = () => (
  <div>
    <h1>Hubo un problema con el registro</h1>
    <p>Por favor, intenta completar el registro nuevamente.</p>
    <button onClick={() => window.location.href = '/registro-micro'}>
      Reintentar
    </button>
  </div>
);

export default ReintentarOnboarding;
