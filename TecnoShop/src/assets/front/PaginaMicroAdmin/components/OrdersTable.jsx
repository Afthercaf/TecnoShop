import { useState, useEffect } from 'react';
import axios from '../../../../api/axios';
import Sidebar from './Sidebar';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedOrder, setEditedOrder] = useState({});

  // Status color mapping
  const statusColors = {
    'pendiente': 'text-yellow-600 bg-yellow-100',
    'pagado': 'text-blue-600 bg-blue-100',
    'cancelado': 'text-red-600 bg-red-100',
    'enviado': 'text-purple-600 bg-purple-100',
    'completado': 'text-green-600 bg-green-100'
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
          const [name, value] = cookie.split('=');
          acc[name] = value;
          return acc;
        }, {});

        const tiendaToken = cookies.tiendaToken;
        console.log(tiendaToken)

        if (!tiendaToken) {
          console.error('No se encontró el tiendaToken.');
          setOrders([]);
          setFilteredOrders([]);
          return;
        }

        const response = await axios.get('/pedidos', { withCredentials: true });
        const fetchedOrders = Array.isArray(response.data.pedidos) ? response.data.pedidos : [];
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
        console.log(response.data.pedidos);
      } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        setOrders([]);
        setFilteredOrders([]);
      }
    };

    fetchOrders();
  }, []);

  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;
    setFilter(selectedFilter);
    setFilteredOrders(
      selectedFilter ? orders.filter((order) => order.estado === selectedFilter) : orders
    );
  };

  const handleEditClick = (order) => {
    setEditingId(order._id);
    setEditedOrder({ ...order });
  };


  const handleSaveClick = async (_id) => {
    try {

      console.log(_id);
      // TODO: Implement actual API call to update order
       await axios.put(`/pedidos/${_id}`, editedOrder);
       
      
      setOrders(orders.map((order) => 
        order._id === id ? { ...order, estado: editedOrder.estado } : order
      ));
      setFilteredOrders(filteredOrders.map((order) => 
        order._id === id ? { ...order, estado: editedOrder.estado } : order
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedOrder((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="p-8 w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Órdenes de Servicio</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-100 border-b">
            <label htmlFor="filter" className="mr-3 text-gray-700 font-medium">
              Filtrar por estado:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={handleFilterChange}
              className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">Todos los estados</option>
              {Object.keys(statusColors).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="p-4 text-left">ID</th>
                  <th className="p-4 text-left">Usuario</th>
                  <th className="p-4 text-left">Dirección</th>
                  <th className="p-4 text-left">Fecha</th>
                  <th className="p-4 text-left">Estado</th>
                  <th className="p-4 text-left">Total</th>
                  <th className="p-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((pedido) => (
                  <tr 
                    key={pedido._id} 
                    className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <td className="p-4 text-gray-700">{pedido._id}</td>
                    <td className="p-4 text-gray-700">{pedido.usuario.username}</td>
                    <td className="p-4 text-gray-700">{pedido.direccionEnvio}</td>
                    <td className="p-4 text-gray-700">{formatDate(pedido.fechaCompra)}</td>
                    <td className="p-4">
                      {editingId === pedido._id ? (
                        <select
                          name="estado"
                          value={editedOrder.estado}
                          onChange={handleInputChange}
                          className="border border-gray-300 p-2 rounded-md w-full"
                        >
                          {Object.keys(statusColors).map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            statusColors[pedido.estado.toLowerCase()] || 'text-gray-600 bg-gray-100'
                          }`}
                        >
                          {pedido.estado}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-700">{formatCurrency(pedido.totalCompra)}</td>
                    <td className="p-4 space-x-2">
                      {editingId === pedido._id ? (
                        <button
                          onClick={() => handleSaveClick(pedido._id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                        >
                          Guardar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(pedido)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                        >
                          Editar Estado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
