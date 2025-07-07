// auth.guard.ts
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const userId = this.validateToken(client);
    
    if (!userId) {
      throw new WsException('Unauthorized');
    }
    
    client.userId = userId; // Attach user ID to socket
    return true;
  }

  private validateToken(token: string): string | null {
    // Implement your token validation logic
    return token;
  }
}
