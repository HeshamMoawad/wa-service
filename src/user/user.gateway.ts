// user.gateway.ts
import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConnectionManagerService } from './connection-manager.service';
import { WsAuthGuard } from './auth.guard';
import { UseGuards } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';

@UseGuards(WsAuthGuard)
@WebSocketGateway()
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(private connectionManager: ConnectionManagerService) {}

  @SubscribeMessage('login')
  handleLogin(@MessageBody() data :any ,@ConnectedSocket() socket: Socket) {
    const userId = this.getUserIdFromSocket(socket,data); 
    console.log("User --------",userId,socket.id);
    socket.handshake.auth = {userId:data.data.token};
    this.connectionManager.addConnection(userId, socket);
    console.log("User connected",userId,socket.id);
    socket.emit("testing",{userId:userId,socketId:socket.id});
    socket.emit("login",socket.handshake.auth.userId);
  }

  @SubscribeMessage('t')
  handleLogout(@ConnectedSocket() socket: Socket) {
    // this.connectionManager.removeConnection(socket);
    console.log("t ",socket.id,socket.handshake.auth.userId);
    socket.emit("t",socket.handshake.auth.userId);
  }

  handleConnection( socket: Socket) {
    // const userId = this.getUserIdFromSocket(socket,data); 
    // console.log("User --------",socket.id);
    // socket.handshake.auth = {userId:data.data.token};
    // this.connectionManager.addConnection(userId, socket);
    // console.log("User connected",userId,socket.id);
    // this.server.emit("testing",{userId:userId,socketId:socket.id});
  }

  handleDisconnect(socket: Socket) {
    this.connectionManager.removeConnection(socket);
    console.log("User disconnected",socket.id);
    socket.emit("testing",socket.id);
  }

  private getUserIdFromSocket(socket: Socket,data:any): string {
    const userId = data.data.token;
    console.log("User connected",userId );
    return userId;
  }
}