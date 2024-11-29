import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../images/tecnoshopBlanco.png'; // Ajusta esta ruta si es necesario

export default function Sidebar() {
  const storeName = 'mi-tienda'; // Puedes cambiar esto por una variable dinámica si es necesario

  return (
    <aside className="sticky top-0 w-64 h-screen bg-black text-white p-5 flex flex-col justify-between">
      <div className="bg-black p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">TecnoShop</h1> {/* Texto TecnoShop */}
        <img src={logo} alt="TecnoShop Logo" className="h-20 mx-auto" /> {/* Imagen agrandada */}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-8">Panel de Control</h2>
        <nav>
          <ul className="space-y-6">
            <li>
              <Link to="/admin-dashboard" className="flex items-center space-x-3 text-lg hover:text-gray-300">
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/products" className="flex items-center space-x-3 text-lg hover:text-gray-300">
                <span>Productos</span>
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/orders" className="flex items-center space-x-3 text-lg hover:text-gray-300">
                <span>Órdenes de Servicio</span>
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/store" className="flex items-center space-x-3 text-lg hover:text-gray-300">
                <span>Configuración de la Tienda</span>
              </Link>
            </li>
            <li>
              <Link to={`/store/${storeName}`} className="flex items-center space-x-3 text-lg hover:text-gray-300">
                <span>Tu tienda</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mt-4">
        <Link to="/" className="flex items-center justify-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
          Regresar a la Tienda Principal
        </Link>
      </div>

      <footer className="mt-8 text-gray-500 text-sm text-center">
        © 2024 TecnoShop
      </footer>
    </aside>
  );
}
