import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from './api';
import { socket } from './socket';
import './Kds.css';

export const Kds: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchActiveOrders = async () => {
      try {
        const allOrders = await getOrders();
        // Filter to active kitchen orders
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

    // 2. WebSocket Listeners
    const onOrderCreated = (payload: any) => {
      console.log('KDS: Order Created', payload);
      // Even if Kiosk creates it as PENDING_PAYMENT, we only care when it's PAID.
      // But if Kiosk created it as PAID directly, we add it.
      if (payload.status === 'PAID' || payload.status === 'PREPARING') {
        setOrders((prev) => [...prev, payload.order]);
      }
    };

    const onOrderUpdated = (payload: any) => {
      console.log('KDS: Order Updated', payload);
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === payload.order.id);
        
        // If it was moved to a terminal/non-kitchen state (READY, DELIVERED, REJECTED), remove it
        if (['READY', 'DELIVERED', 'REJECTED'].includes(payload.status)) {
          return prev.filter((o) => o.id !== payload.order.id);
        }

        if (exists) {
          // Update existing
          return prev.map((o) => (o.id === payload.order.id ? payload.order : o));
        } else if (payload.status === 'PAID') {
          // It just became PAID, add it
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
    try {
      await updateOrderStatus(id, newStatus);
      // We don't necessarily need to update local state immediately because 
      // the WebSocket will emit 'order.updated' and update it for us globally!
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div className="kds-loading">Loading Kitchen Display...</div>;
  if (error) return <div className="kds-error">Error: {error}</div>;

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>👨‍🍳 Kitchen Display System</h1>
        <div className="kds-status">
          <span className={`socket-indicator ${socket.connected ? 'online' : 'offline'}`}></span>
          {socket.connected ? 'Live' : 'Disconnected'}
        </div>
      </header>

      <main className="kds-board">
        {orders.length === 0 ? (
          <div className="empty-board">No active orders. Kitchen is clear!</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order.id} className={`kds-ticket status-${order.status.toLowerCase()}`}>
                <div className="ticket-header">
                  <h2>Order #{order.id}</h2>
                  <span className="time">{new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                
                <div className="ticket-body">
                  <ul>
                    {order.items?.map((item: any, idx: number) => (
                      <li key={idx}>
                        <strong>{item.quantity}x</strong> {item.custom_note || `Product ${item.product_id}`}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ticket-footer">
                  <span className="status-badge">{order.status}</span>
                  <div className="ticket-actions">
                    {order.status === 'PAID' && (
                      <button 
                        className="btn-accept" 
                        onClick={() => handleAction(order.id, 'PREPARING')}
                      >
                        Accept (In Progress)
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button 
                        className="btn-complete" 
                        onClick={() => handleAction(order.id, 'READY')}
                      >
                        Complete (Done)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
