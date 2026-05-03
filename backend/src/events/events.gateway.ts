import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  // --- Client to Server Events ---

  @SubscribeMessage('kitchen.accept_order')
  handleAcceptOrder(client: Socket, payload: { orderId: number; cookId: number }) {
    // Forward to OrdersService to update state to PREPARING
    return { event: 'order.status_updated', data: { orderId: payload.orderId, status: 'PREPARING' } };
  }

  @SubscribeMessage('kitchen.complete_order')
  handleCompleteOrder(client: Socket, payload: { orderId: number }) {
    // Forward to OrdersService to update state to READY
    // this.server.emit('order.status_updated', { ... });
  }

  // --- Server to Client Broadcast Methods (to be called by Services) ---

  broadcastOrderCreated(orderData: any) {
    this.server.emit('order.created', {
      order: orderData,
      status: orderData.status,
    });
  }

  broadcastOrderUpdated(orderData: any) {
    this.server.emit('order.updated', {
      order: orderData,
      status: orderData.status,
    });
  }
}
