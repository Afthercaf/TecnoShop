import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTienda } from "../../../context/TiendaContext";
import video1 from "../PaginaMicro/videos/video1.mp4";
import logo from "../images/tecnoshopBlanco.png";

export default function RegistroMicro() {
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState([]);
  const [onboardingLink, setOnboardingLink] = useState(null);
  const navigate = useNavigate();
  const { registerTienda } = useTienda();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]); // Reset errors upon form submission

    // Validate that passwords match
    if (password !== confirmPassword) {
      setLoading(false);
      setErrors(["Las contraseñas no coinciden."]);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setLoading(false);
      setErrors(["La contraseña debe tener al menos 6 caracteres."]);
      return;
    }

    // Store the data to register the store
    const tiendaData = {
      nombre: empresa,
      email,
      password,
      descripcion,
      logo: logoURL,
      direccion,
      telefono,
    };

    try {
      const response = await registerTienda(tiendaData);
      
      // Check if onboarding link is returned
      if (response.onboardingLink) {
        setOnboardingLink(response.onboardingLink);
      } else {
        navigate("/login-vendor");
      }
    } catch (error) {
      setLoading(false);
      setErrors(["Error al registrar la tienda. Por favor verifica los datos."]);
    }
    setLoading(false);
  };

  const redirectToLogin = () => {
    navigate("/login-vendor");
  };

  const handleOnboarding = () => {
    if (onboardingLink) {
      window.location.href = onboardingLink;
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center">
      <video className="absolute top-0 left-0 w-full h-full object-cover -z-10" src={video1} autoPlay loop muted />
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 -z-10"></div>
      <div className="flex max-w-5xl bg-gray-200 bg-opacity-90 rounded-lg shadow-lg overflow-hidden w-full z-10 gap-8">
        <div className="w-1/2 p-8 bg-black text-white flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold mb-4">Bienvenido a TecnoShop</h2>
          <p className="text-lg mb-4 text-center">Regístrate para gestionar tu negocio de forma eficiente en nuestra plataforma.</p>
          <img src={logo} alt="TecnoShop logo" className="w-40 h-40 mb-6" />
        </div>
        <div className="w-1/2 p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">TecnoShop</h1>
          <h3 className="text-lg font-medium text-center text-gray-600 mb-6">Crea tu cuenta de vendedor ahora</h3>
          
          {onboardingLink ? (
            <div className="text-center">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Confirmación de Método de Pago</p>
                <p>Por favor, completa tu registro de pago. Tienes 10 minutos para confirmar.</p>
                <p className="mt-2 text-sm">Después de hacer clic, serás redirigido a Stripe para configurar tus métodos de pago.</p>
              </div>
              <button 
                onClick={handleOnboarding}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition duration-300"
              >
                Confirmar Método de Pago
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Nombre de Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="text" placeholder="URL del Logo" value={logoURL} onChange={(e) => setLogoURL(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" />
              <input type="text" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="mb-4 w-full px-4 py-2 border rounded-lg" required />
              <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mb-6 w-full px-4 py-2 border rounded-lg" required />
              
              {errors.length > 0 && (
                <div className="mb-4 text-red-500 text-center">
                  {errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-3 rounded-lg font-semibold"
              >
                {loading ? "Procesando..." : "Crear cuenta"}
              </button>
              
              <div className="text-center text-gray-600 mt-4">
                ¿Ya tienes cuenta?{" "}
                <button 
                  onClick={redirectToLogin} 
                  className="text-black font-semibold hover:underline"
                >
                  Inicia sesión ahora
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
