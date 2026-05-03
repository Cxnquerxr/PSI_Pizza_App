import React, { useState, useEffect, useRef } from 'react';
import { createOrder } from './api';
import type { OrderItemPayload } from './api';
import { socket } from './socket';
import './Kiosk.css';

const CATALOG = [
  { id: 1, name: 'Margherita', price: 7.9, description: 'Čerstvá mozzarella, rajčinový základ, bazalka' },
  { id: 2, name: 'Pepperoni Classic', price: 8.9, description: 'Prémiová saláma, rajčinový základ, čerstvá mozzarella' },
  { id: 3, name: 'Quattro Formaggi', price: 9.9, description: 'Mozzarella, gorgonzola, parmezán, ementál' },
  { id: 4, name: 'Hawai', price: 8.5, description: 'Šunka, ananás, rajčinový základ, mozzarella' },
  { id: 5, name: 'Prosciutto', price: 9.5, description: 'Prosciutto crudo, rukola, parmezán, mozzarella' },
  { id: 6, name: 'Vegetariana', price: 8.9, description: 'Grilovaná zelenina, kukurica, olivy, mozzarella' },
];

const ADDONS = [
  { name: 'Saláma', price: 1.0 },
  { name: 'Šampiňóny', price: 1.0 },
  { name: 'Cibuľa', price: 1.0 },
  { name: 'Slanina', price: 1.0 },
  { name: 'Čierne Olivy', price: 1.0 },
  { name: 'Extra mozzarella', price: 1.5 },
  { name: 'Jalapeňo', price: 1.0 },
  { name: 'Čerstvé rajčiny', price: 1.0 },
];

type ViewState = 'idle' | 'menu' | 'customize' | 'cart' | 'payment_pending' | 'payment_declined';

export const Kiosk: React.FC = () => {
  const [view, setView] = useState<ViewState>('idle');
  const [cart, setCart] = useState<OrderItemPayload[]>([]);
  const [selectedPizza, setSelectedPizza] = useState<typeof CATALOG[0] | null>(null);

  // Customize state
  const [selectedSize, setSelectedSize] = useState('Stredná');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Cart/Checkout state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  // ref so the websocket handler always sees the current orderId
  const pendingOrderIdRef = useRef<number | null>(null);

  useEffect(() => {
    const onOrderUpdated = (payload: any) => {
      if (payload.order?.id !== pendingOrderIdRef.current) return;

      if (payload.status === 'PAID') {
        // Payment approved — show brief success then return to idle
        setCart([]);
        setPendingOrderId(null);
        pendingOrderIdRef.current = null;
        setView('idle');
      } else if (payload.status === 'REJECTED') {
        // Payment declined by operator
        setView('payment_declined');
      }
    };

    socket.on('order.updated', onOrderUpdated);
    return () => { socket.off('order.updated', onOrderUpdated); };
  }, []);

  const handleOpenCustomize = (pizza: typeof CATALOG[0]) => {
    setSelectedPizza(pizza);
    setSelectedSize('Stredná');
    setSelectedAddons([]);
    setQuantity(1);
    setView('customize');
  };

  const toggleAddon = (addonName: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonName) ? prev.filter(a => a !== addonName) : [...prev, addonName]
    );
  };

  const calculateItemTotal = () => {
    if (!selectedPizza) return 0;
    let base = selectedPizza.price;
    // Simple size logic
    if (selectedSize === 'Malá') base -= 1.0;
    if (selectedSize === 'Veľká') base += 2.0;
    if (selectedSize === 'Extra') base += 4.0;

    let addonsCost = 0;
    selectedAddons.forEach(a => {
      const addon = ADDONS.find(x => x.name === a);
      if (addon) addonsCost += addon.price;
    });

    return (base + addonsCost) * quantity;
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const addToCart = () => {
    if (!selectedPizza) return;

    const note = `${selectedPizza.name} (${selectedSize})` +
      (selectedAddons.length > 0 ? ` + ${selectedAddons.join(', ')}` : '');

    const unitPrice = calculateItemTotal() / quantity;

    setCart(prev => [
      ...prev,
      {
        product_id: selectedPizza.id,
        quantity: quantity,
        unit_price: unitPrice,
        custom_note: note
      }
    ]);

    setView('menu');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the order — operator must confirm/decline via curl
      const order = await createOrder({ items: cart });
      setPendingOrderId(order.id);
      pendingOrderIdRef.current = order.id;
      setView('payment_pending');
    } catch (err: any) {
      setError(err.message || 'Objednávku sa nepodarilo odoslať.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'idle') {
    return (
      <div className="kiosk-idle" onClick={() => setView('menu')}>
        <div className="idle-content">
          <div className="pizza-icon">🍕</div>
          <h1>Pizza Paradise</h1>
          <p>Najlepšia pizza v Bratislave</p>
          <button className="start-btn">Začať objednávku &rarr;</button>
          <div className="touch-hint">Dotknite sa obrazovky</div>
        </div>
      </div>
    );
  }

  if (view === 'menu') {
    return (
      <div className="kiosk-container white-bg">
        <header className="kiosk-header-red">
          <div className="header-left">
            <div className="pizza-logo-small">🍕</div>
            <div className="header-text">
              <h2>Pizza Menu</h2>
              <p>Vyberte si pizzu z našej chutnej ponuky</p>
            </div>
          </div>
          <button className="cart-icon-btn" onClick={() => setView('cart')}>
            🛒
            {getCartItemsCount() > 0 && <span className="cart-badge">{getCartItemsCount()}</span>}
          </button>
        </header>

        <main className="menu-grid">
          {CATALOG.map((item) => (
            <div key={item.id} className="pizza-card" onClick={() => handleOpenCustomize(item)}>
              <div className="pizza-img-placeholder">
                <span className="placeholder-icon">📷</span>
              </div>
              <div className="pizza-card-info">
                <h3>{item.name}</h3>
                <p className="price">od {item.price.toFixed(2)}€</p>
                <p className="description">{item.description}</p>
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (view === 'customize' && selectedPizza) {
    return (
      <div className="kiosk-container white-bg">
        <header className="kiosk-header-white">
          <button className="back-btn" onClick={() => setView('menu')}>&times; Späť do Menu</button>
          <h2>Prispôsobte si výber</h2>
          <button className="cart-icon-btn red" onClick={() => setView('cart')}>
            🛒
            {getCartItemsCount() > 0 && <span className="cart-badge">{getCartItemsCount()}</span>}
          </button>
        </header>

        <main className="customize-layout">
          <div className="customize-left">
            <div className="pizza-img-large-placeholder">
              <span className="placeholder-icon">📷</span>
            </div>
            <h1>{selectedPizza.name}</h1>
            <p className="description-large">{selectedPizza.description}</p>
          </div>

          <div className="customize-right">
            <div className="section">
              <h3>Zvoľ veľkosť</h3>
              <div className="size-selector">
                {['Malá', 'Stredná', 'Veľká', 'Extra'].map(s => (
                  <button
                    key={s}
                    className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>Pridaj doplnky</h3>
              <div className="addons-list">
                {ADDONS.map(addon => (
                  <div
                    key={addon.name}
                    className="addon-item"
                    onClick={() => toggleAddon(addon.name)}
                  >
                    <span>{addon.name}</span>
                    <span className="addon-price">+{addon.price.toFixed(2)}€</span>
                    <div className={`checkbox ${selectedAddons.includes(addon.name) ? 'checked' : ''}`}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section qty-section">
              <h3>Počet</h3>
              <div className="qty-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <button className="add-to-cart-btn" onClick={addToCart}>
              🛒 Pridať do košíka - {calculateItemTotal().toFixed(2)}€
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'cart') {
    return (
      <div className="kiosk-container white-bg cart-view">
        <header className="kiosk-header-white">
          <button className="back-btn" onClick={() => setView('menu')}>&times; Späť</button>
          <h2>Váš košík</h2>
        </header>

        <main className="cart-main">
          {error && <div className="alert alert-error">{error}</div>}

          {cart.length === 0 && (
            <div className="empty-cart-msg">
              <p>Váš košík je prázdny.</p>
              <button className="back-to-menu-btn" onClick={() => setView('menu')}>Zobraziť menu</button>
            </div>
          )}

          {cart.length > 0 && (
            <>
              <div className="cart-items-list">
                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item-row">
                    <div className="cart-item-qty">{item.quantity}x</div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.custom_note}</div>
                    </div>
                    <div className="cart-item-price">{(item.quantity * item.unit_price).toFixed(2)}€</div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>Spolu k úhrade:</span>
                  <span>{calculateCartTotal()}€</span>
                </div>
                <button
                  className={`checkout-btn-large ${isSubmitting ? 'disabled' : ''}`}
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Spracovávam...' : 'Zaplatiť objednávku'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  if (view === 'payment_pending') {
    return (
      <div className="kiosk-payment-pending">
        <div className="payment-pending-content">
          <div className="payment-spinner"></div>
          <h2>Prebieha platba</h2>
          <p>Vaša objednávka <strong>#{pendingOrderId}</strong> čaká na potvrdenie platieb.</p>
          <p className="payment-hint">Operator používa platobný terminál na potvrdenie alebo zamietnutie platby.</p>
        </div>
      </div>
    );
  }

  if (view === 'payment_declined') {
    return (
      <div className="kiosk-payment-declined">
        <div className="payment-declined-content">
          <div className="declined-icon">❌</div>
          <h2>Platba zamietnutá</h2>
          <p>Vaša platba nebola úspešná. Skúšte znova alebo zvoľte iný spôsob platby.</p>
          <div className="declined-actions">
            <button className="btn-retry" onClick={() => {
              setPendingOrderId(null);
              pendingOrderIdRef.current = null;
              setView('cart');
            }}>Skúšiť znova</button>
            <button className="btn-cancel-order" onClick={() => {
              setPendingOrderId(null);
              pendingOrderIdRef.current = null;
              setCart([]);
              setView('idle');
            }}>Zrušiť objednávku</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
