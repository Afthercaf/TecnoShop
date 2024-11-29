import { useState, useEffect, createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Cookies from 'js-cookie';
import axios from "../../../api/axios";
import { useAuthUser } from '../../../context/authContext';
import { useUsers } from '../../../context/UserContext';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaGift, FaTruck } from 'react-icons/fa';

// Stripe configuration
const stripePromise = loadStripe('pk_test_51QNkz6AU7UFoerJE6cqMZvZz5Q9JE8XtMbcLzhRkBWxZWQKSar7BTGHS7ejnhRmOm75i5EwC2JlrjklgndhwiCZg00ParyAtga');

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = Cookies.get('cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [totalItems, setTotalItems] = useState(() => {
    const storedCart = Cookies.get('cart');
    return storedCart ? JSON.parse(storedCart).reduce((acc, item) => acc + item.quantity, 0) : 0;
  });

  useEffect(() => {
    Cookies.set('cart', JSON.stringify(cart), { expires: 7 });
    setTotalItems(cart.reduce((acc, item) => acc + item.quantity, 0));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((prod) => prod.id === product.id);
      
      const updatedCart = existingProduct
        ? prevCart.map((prod) =>
            prod.id === product.id
              ? { ...prod, quantity: (prod.quantity || 0) + quantity }
              : prod
          )
        : [...prevCart, { ...product, quantity }];
      setTotalItems(updatedCart.reduce((acc, item) => acc + item.quantity, 0));
      return updatedCart;
    });
  };
  
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart((prevCart) => {
      const updatedCart = prevCart.map((prod) =>
        prod.id === productId ? { ...prod, quantity } : prod
      );
      setTotalItems(updatedCart.reduce((acc, item) => acc + item.quantity, 0));
      return updatedCart;
    });
  };
  
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((prod) => prod.id !== productId);
      setTotalItems(updatedCart.reduce((acc, item) => acc + item.quantity, 0));
      return updatedCart;
    });
  };

  // Clear cart method
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart, 
      totalItems 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};

const CartPaymentForm = ({ total, cart, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthUser();
  const { getUser, clearCart } = useCart();

  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

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

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (!stripe || !elements) return;

    setCargando(true);
    setMensaje('');

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setMensaje('Error al procesar los detalles de la tarjeta.');
        onPaymentError(error);
        setCargando(false);
        return;
      }
      console.log(cart.map(product => product._id));  // Verifica que todos los productos tengan ID

      const pedidoData = {
        productos: cart.map(product => ({
          productoId: product._id,
          cantidad: product.quantity,
        })),
        metodoPago: 'tarjeta',
        direccionEnvio: direccionEnvio || user.address || "Dirección predeterminada",
        paymentDetails: { 
          paymentMethodId: paymentMethod.id,
          tarjetaDetails: 'Pago con Stripe'
        },
        total: total
      };

      const response = await axios.post('/payments', pedidoData, {
        withCredentials: true,
      });

      if (response.data.compra) {
        onPaymentSuccess(response.data.compra);
        clearCart(); // Clear the cart after successful payment
      } else {
        onPaymentError('Error al confirmar la compra.');
      }
      setCargando(false);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      onPaymentError('Ocurrió un error al procesar el pago.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Dirección de Envío
        </label>
        <input
          type="text"
          value={direccionEnvio}
          onChange={(e) => setDireccionEnvio(e.target.value)}
          required
          className="w-full bg-gray-700/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          placeholder="Ingresa tu dirección de envío"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Detalles de la Tarjeta
        </label>
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#f3f4f6',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
            classes: {
              base: 'bg-gray-700/50 rounded-lg px-4 py-2',
            }
          }}
          className="p-3 bg-gray-700/50 rounded-lg"
        />
      </div>

      {mensaje && (
        <div className={`mt-4 p-3 rounded text-center ${mensaje.includes('confirmada') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      <button 
        type="submit" 
        disabled={cargando}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
      >
        <FaTruck />
        <span>{cargando ? 'Procesando...' : 'Pagar Ahora'}</span>
      </button>
    </form>
  );
};

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, totalItems } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);  // New state to control checkout process

  const total = cart.reduce(
    (sum, product) => sum + (parseFloat(product.precio) || 0) * (product.quantity || 0),
    0
  );

  const handleProceedToPayment = () => {
    if (cart.length > 0) {
      setIsCheckingOut(true);  // Open the checkout section
    }
  };

  const handlePaymentSuccess = (purchaseDetails) => {
    setPaymentStatus('success');
    setIsCheckingOut(false);  // Close checkout section
    setTimeout(() => setPaymentStatus(null), 3000);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('error');
    setTimeout(() => setPaymentStatus(null), 3000);
  };
  

  const handleApplyDiscount = () => {
    // Lógica para aplicar el descuento
    console.log('Descuento aplicado');
  };
  

  const QuantityControl = ({ product }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => updateQuantity(product.id, Math.max(1, product.quantity - 1))}
        className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
      >
        <FaMinus className="w-3 h-3 text-white" />
      </button>
      <span className="w-8 text-center font-medium">{product.quantity}</span>
      <button
        onClick={() => updateQuantity(product.id, product.quantity + 1)}
        className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
      >
        <FaPlus className="w-3 h-3 text-white" />
      </button>
    </div>
  );

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-gray-100">
        <div className="max-w-6xl mx-auto">
          {/* Payment Status Overlay */}
          {paymentStatus && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center ${
                paymentStatus === "success" ? "bg-green-500" : "bg-red-500"
              } bg-opacity-90 animate-purchase-status`}
            >
              {paymentStatus === "success" ? (
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
  
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items Section */}
            <div className="lg:w-2/3 space-y-6">
              <div className="flex items-center space-x-4 mb-8">
                <FaShoppingCart className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold">Carrito de Compras</h1>
                  <p className="text-gray-400">
                    Tienes {totalItems} productos en tu carrito
                  </p>
                </div>
              </div>
  
              {cart.length === 0 ? (
                <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
                  <FaShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((product) => (
                    <div
                      key={product.id}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-6 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800/70"
                    >
                      <img
                        src={product.imagenes}
                        alt={product.nombre}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg mb-1">
                          {product.nombre}
                        </h3>
                        <p className="text-blue-400 font-bold text-xl mb-2">
                          ${(parseFloat(product.precio) || 0).toFixed(2)}
                        </p>
                        <QuantityControl product={product} />
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
  
            {/* Order Summary Section */}
            <div className="lg:w-1/3">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>
  
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Envío</span>
                    <span className="text-green-400">Gratis</span>
                  </div>
                </div>
  
                <div className="relative mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaGift className="text-blue-400" />
                    <span className="font-medium">Código de Descuento</span>
                  </div>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    placeholder="Ingresa tu código"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount}
                    className={`mt-2 w-full py-2 rounded-lg transition-all duration-200 ${
                      isApplyingDiscount
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isApplyingDiscount ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
  
                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Incluyendo IVA</p>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={cart.length === 0}
                  className={`w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                    cart.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FaTruck />
                  <span>Proceder al Pago</span>
                </button>
              </div>
            </div>
          </div>
  
          {/* Payment Section */}
          {isCheckingOut && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Finalizar Compra
                </h2>
                <Elements stripe={stripePromise}>
                  <CartPaymentForm
                    total={total}
                    cart={cart}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default Cart;