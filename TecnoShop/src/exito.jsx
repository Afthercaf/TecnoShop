import React from 'react';

const ExitoOnboarding = () => (
  <div>
    <h1>¡Registro completado!</h1>
    <p>Tu cuenta de vendedor está lista. Ahora puedes recibir pagos.</p>
    <button onClick={() => window.location.href = '/admin-dashboard'}>
      Ir al Panel
    </button>
  </div>
);

export default ExitoOnboarding;
