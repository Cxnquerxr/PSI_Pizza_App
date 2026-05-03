import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from './api';
import { socket } from './socket';
import './Kds.css';

export const Kds: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const allOrders = await getOrders();
        const active = allOrders.filter(
          (o: any) => o.status === 'PAID' || o.status === 'PREPARING'
        );
        setOrders(active);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();

    const onOrderCreated = (payload: any) => {
      if (payload.status === 'PAID' || payload.status === 'PREPARING') {
        setOrders((prev) => [...prev, payload.order]);
      }
    };

    const onOrderUpdated = (payload: any) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === payload.order.id);
        
        if (['READY', 'DELIVERED', 'REJECTED'].includes(payload.status)) {
          return prev.filter((o) => o.id !== payload.order.id);
        }

        if (exists) {
          return prev.map((o) => (o.id === payload.order.id ? payload.order : o));
        } else if (payload.status === 'PAID') {
          return [...prev, payload.order];
        }

        return prev;
      });
    };

    socket.on('order.created', onOrderCreated);
    socket.on('order.updated', onOrderUpdated);

    return () => {
      socket.off('order.created', onOrderCreated);
      socket.off('order.updated', onOrderUpdated);
    };
  }, []);

  const handleAction = async (id: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      setSelectedOrder(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="kds-loading">Načítavam...</div>;
  if (error) return <div className="kds-error">Chyba: {error}</div>;

  const waitingOrders = orders.filter(o => o.status === 'PAID');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  return (
    <div className="kds-layout">
      {/* HEADER IS NOW HANDLED BY COLUMN HEADERS IN THE DESIGN, 
          BUT WE KEEP A SMALL GLOBAL BAR IF NEEDED. FOR NOW WE USE TWO COLUMNS ONLY. */}
          
      <div className="kds-columns">
        
        {/* LEFT COLUMN */}
        <div className="kds-column kds-column-waiting">
          <div className="column-header column-header-waiting">
            <h2>Čakajúce objednávky</h2>
          </div>
          <div className="column-body">
            {waitingOrders.map(order => (
              <div 
                key={order.id} 
                className="kds-card waiting-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="card-top">
                  <div className="card-id-red">#{order.id}</div>
                  <div className="card-title">
                    {/* Display the first item's name or custom logic */}
                    {order.items && order.items.length > 0 
                      ? order.items[0].custom_note?.split('(')[0] || 'Objednávka' 
                      : 'Neznáma Objednávka'}
                  </div>
                  <div className="card-tag orange-tag">NOVÁ</div>
                </div>
                <div className="card-time">
                  Čas objednávky: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="kds-column kds-column-preparing">
          <div className="column-header column-header-preparing">
            <h2>Pripravované objednávky</h2>
          </div>
          <div className="column-body">
            {preparingOrders.map(order => (
              <div 
                key={order.id} 
                className="kds-card preparing-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="card-top">
                  <div className="card-id-green">#{order.id}</div>
                  <div className="card-title">
                    {order.items && order.items.length > 0 
                      ? order.items[0].custom_note?.split('(')[0] || 'Objednávka' 
                      : 'Neznáma Objednávka'}
                  </div>
                  <div className="card-tag green-tag">GIUSEPPE</div>
                </div>
                <div className="card-time">
                  Čas objednávky: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ACTION MODAL */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className={selectedOrder.status === 'PAID' ? 'card-id-red' : 'card-id-green'}>
                #{selectedOrder.id}
              </div>
              <h2 className="modal-title">
                {selectedOrder.items && selectedOrder.items.length > 0 
                      ? selectedOrder.items[0].custom_note?.split('(')[0] || 'Objednávka' 
                      : 'Neznáma Objednávka'}
              </h2>
            </div>
            <div className="modal-time">
              Čas objednávky: {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            <div className="modal-items">
              <ul>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <li key={idx}><strong>{item.quantity}x</strong> {item.custom_note}</li>
                ))}
              </ul>
            </div>
            
            <div className="modal-actions">
              {selectedOrder.status === 'PAID' && (
                <>
                  <button 
                    className="btn-reject"
                    onClick={() => handleAction(selectedOrder.id, 'REJECTED')}
                    disabled={isUpdating}
                  >
                    Odmietnuť
                  </button>
                  <button 
                    className="btn-accept"
                    onClick={() => handleAction(selectedOrder.id, 'PREPARING')}
                    disabled={isUpdating}
                  >
                    Prijať
                  </button>
                </>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <>
                   <button 
                    className="btn-cancel"
                    onClick={() => setSelectedOrder(null)}
                    disabled={isUpdating}
                  >
                    Zrušiť
                  </button>
                  <button 
                    className="btn-finish"
                    onClick={() => handleAction(selectedOrder.id, 'READY')}
                    disabled={isUpdating}
                  >
                    Dokončiť
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
