import React, { useState } from 'react';
import { createOrder, OrderItemPayload } from './api';
import './Kiosk.css';

// Mock catalog for simplicity
const CATALOG = [
  { id: 1, name: 'Margherita Pizza', price: 12.5 },
  { id: 2, name: 'Pepperoni Pizza', price: 15.0 },
  { id: 3, name: 'Coca Cola', price: 2.5 },
  { id: 4, name: 'Garlic Bread', price: 4.0 },
];

export const Kiosk: React.FC = () => {
  const [cart, setCart] = useState<OrderItemPayload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          quantity: 1,
          unit_price: product.price,
          custom_note: `Item: ${product.name}`, // Storing name in note for simple display
        },
      ];
    });
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setOrderSuccess(null);

    try {
      const result = await createOrder({ items: cart });
      setOrderSuccess(result.id);
      setCart([]);
    } catch (err: any) {
      setError(err.message || 'Failed to checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kiosk-container">
      <header className="kiosk-header">
        <h1>🍕 Premium Pizzeria Kiosk</h1>
        <p>Order your favorites with a tap.</p>
      </header>

      <main className="kiosk-main">
        <div className="catalog-section">
          <h2>Menu</h2>
          <div className="catalog-grid">
            {CATALOG.map((item) => (
              <div key={item.id} className="catalog-card" onClick={() => addToCart(item)}>
                <h3>{item.name}</h3>
                <p className="price">${item.price.toFixed(2)}</p>
                <button className="add-btn">+</button>
              </div>
            ))}
          </div>
        </div>

        <aside className="cart-section">
          <h2>Your Order</h2>

          {error && <div className="alert-error">{error}</div>}
          {orderSuccess && (
            <div className="alert-success">
              🎉 Order #{orderSuccess} placed successfully! Please pay at the counter.
            </div>
          )}

          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <span className="item-qty">{item.quantity}x</span>
                  <span className="item-name">{item.custom_note?.replace('Item: ', '')}</span>
                  <span className="item-total">${(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="total-row">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>
            <button
              className={`checkout-btn ${cart.length === 0 || isSubmitting ? 'disabled' : ''}`}
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Place Order & Pay'}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
