import { createContext, useContext, useEffect, useState } from "react";
import { loginTiendaRequest, registerTiendaRequest, verifyTiendaTokenRequest } from "../api/auth";
import Cookies from "js-cookie";

const TiendaContext = createContext();

// Hook para usar el contexto de Tienda
export const useTienda = () => {
  const context = useContext(TiendaContext);
  if (!context) throw new Error("useTienda debe ser usado dentro de un TiendaProvider");
  return context;
};

export const TiendaProvider = ({ children }) => {
  const [tienda, setTienda] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Borrar errores después de 5 segundos
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Función para registrar una tienda
  const registerTienda = async (tiendaData) => {
    try {
      const res = await registerTiendaRequest(tiendaData);
      if (res.status === 200) {
        setTienda(res.data);
        console.log(res.data)
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error(error.response.data);
      setErrors(error.response.data.message || "Error al registrar la tienda");
    }
  };

  // Función para iniciar sesión de una tienda
  const loginTienda = async (tiendaData) => {
    try {
      const res = await loginTiendaRequest(tiendaData);
      setTienda(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error(error);
      setErrors(error.response?.data?.message || "Error al iniciar sesión");
    }
  };

  // Función para cerrar sesión de una tienda
  const logoutTienda = () => {
    Cookies.remove("token");
    setTienda(null);
    setIsAuthenticated(false);
  };

  // Verificar el token de la tienda al cargar el componente
  useEffect(() => {
    const verificarToken = async () => {
      const tiendaToken = Cookies.get("tiendaToken");
      if (!tiendaToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await verifyTiendaTokenRequest(tiendaToken);
        if (res.data) {
          setIsAuthenticated(true);
          setTienda(res.data);
        } else {
          setIsAuthenticated(false);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error al verificar el tiendaToken", error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    verificarToken();
  }, []);


  return (
    <TiendaContext.Provider
      value={{
        tienda,
        registerTienda,
        loginTienda,
        logoutTienda,
        isAuthenticated,
        errors,
        loading,
      }}
    >
      {children}
    </TiendaContext.Provider>
  );
};

export default TiendaContext;