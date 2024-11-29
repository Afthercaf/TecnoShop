import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser } from './context/authContext';
import { useUsers } from './context/UserContext';
import axios from "./api/axios";

const stripePromise = loadStripe('pk_test_51QNkz6AU7UFoerJE6cqMZvZz5Q9JE8XtMbcLzhRkBWxZWQKSar7BTGHS7ejnhRmOm75i5EwC2JlrjklgndhwiCZg00ParyAtga');

const PaginaDePago = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const { user, isAuthenticated } = useAuthUser();
  const { getUser } = useUsers();

  // Extract product and quantity from location state
  const { product, quantity, previousPath = '/' } = location.state || {};

  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);

  // Card details state
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• ••••');
  const [cardName, setCardName] = useState('NOMBRE COMPLETO');
  const [cardExpiry, setCardExpiry] = useState('MM/YY');

  // Redirect if no product
  useEffect(() => {
    if (!product) {
      navigate('/');
    }
  }, [product, navigate]);

  // Load user's address
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && user.id) {
        try {
          const userData = await getUser(user.id);
          if (userData) setDireccionEnvio(userData.address || '');
        } catch (error) {
          console.error("Error al cargar el usuario:", error);
        }
      }
    };
    fetchUserData();
  }, [user, getUser]);

  const handleCardDetailsChange = async (event) => {
    if (event.complete) {
      const cardElement = elements.getElement(CardElement);
      const cardDetails = await stripe.createToken(cardElement);
      
      if (cardDetails.token) {
        const lastFour = cardDetails.token.card.last4;
        setCardNumber(`•••• •••• •••• ${lastFour}`);
      }
    }
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (!stripe || !elements) return;

    setCargando(true);
    setMensaje('');
    setPurchaseStatus(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setMensaje('Error al procesar los detalles de la tarjeta.');
        setPurchaseStatus('error');
        setCargando(false);
        // Navigate back after 3 seconds
        setTimeout(() => {
          navigate(previousPath);
        }, 3000);
        return;
      }

      const pedidoData = {
        productos: [
          {
            productoId: product._id,
            cantidad: quantity,
          }
        ],
        metodoPago: 'tarjeta',
        direccionEnvio: direccionEnvio || user.address || "Dirección predeterminada",
        paymentDetails: { 
          paymentMethodId: paymentMethod.id,
          tarjetaDetails: 'Pago con Stripe'
        },
      };

      const response = await axios.post('/payments', pedidoData, {
        withCredentials: true,
      });

      if (response.data.compra) {
        setPurchaseStatus('success');
        setMensaje('Compra confirmada');
        
        // Navigate back after 3 seconds
        setTimeout(() => {
          navigate(previousPath);
        }, 3000);
      } else {
        setPurchaseStatus('error');
        setMensaje('Error al confirmar la compra.');
        // Navigate back after 3 seconds
        setTimeout(() => {
          navigate(previousPath);
        }, 3000);
      }
      setCargando(false);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      setPurchaseStatus('error');
      setMensaje('Ocurrió un error al procesar el pago.');
      // Navigate back after 3 seconds
      setTimeout(() => {
        navigate(previousPath);
      }, 3000);
      setCargando(false);
    }
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        {/* Purchase Status Animation Overlay */}
        {purchaseStatus && (
          <div className={`absolute inset-0 z-50 flex items-center justify-center 
            ${purchaseStatus === 'success' ? 'bg-green-500' : 'bg-red-500'} 
            bg-opacity-90 rounded-2xl animate-purchase-status`}>
            {purchaseStatus === 'success' ? (
              <div className="text-white text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-24 w-24 mx-auto mb-4 animate-checkmark"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <p className="text-2xl font-bold">Compra Exitosa</p>
              </div>
            ) : (
              <div className="text-white text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-24 w-24 mx-auto mb-4 animate-error"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-2xl font-bold">Error en la Compra</p>
              </div>
            )}
          </div>
        )}

        <h2 className="text-2xl font-bold text-center mb-6">Confirmar Compra</h2>
        
        <div className="mb-6 text-center">
          <img 
            src={product.imagenes} 
            alt={product.nombre} 
            className="w-32 h-32 object-contain mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold">{product.nombre}</h3>
          <p className="text-gray-600">
            Cantidad: {quantity} | Precio total: ${(product.precio * quantity).toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección de Envío
            </label>
            <input
              type="text"
              value={direccionEnvio}
              onChange={(e) => setDireccionEnvio(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu dirección de envío"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre en la Tarjeta
            </label>
            <input 
              type="text" 
              placeholder="Nombre completo" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setCardName(e.target.value || 'NOMBRE COMPLETO')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detalles de la Tarjeta
            </label>
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
              onChange={handleCardDetailsChange}
              className="p-3 border border-gray-300 rounded-md"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {cargando ? 'Procesando...' : 'Pagar Ahora'}
          </button>

          {mensaje && !purchaseStatus && (
            <div className={`mt-4 p-3 rounded text-center ${mensaje.includes('confirmada') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {mensaje}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const PaginaDePagoConStripe = () => (
  <Elements stripe={stripePromise}>
    <PaginaDePago />
  </Elements>
);

export default PaginaDePagoConStripe;