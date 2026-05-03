const API_URL = 'http://localhost:3000';

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
  unit_price: number;
  custom_note?: string;
}

export interface OrderPayload {
  items: OrderItemPayload[];
}

export const createOrder = async (orderPayload: OrderPayload) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create order');
  }

  return response.json();
};

export const getOrders = async () => {
  const response = await fetch(`${API_URL}/orders`);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
};

export const updateOrderStatus = async (id: number, status: string) => {
  const response = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update status');
  }

  return response.json();
};

