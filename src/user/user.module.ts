import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { UserGateway } from './user.gateway';
import { ConnectionManagerService } from './connection-manager.service';
import { StoreService } from 'src/store/store.service';
import { StoreModule } from 'src/store/store.module';
import { ChatAssignmentService } from './chat-assignment.service';
import { DBAccount, AccountSchema } from '../database/schemas/accounts.schema';
import { DBChat, ChatSchema } from '../database/schemas/chat.schema';

@Module({
  imports: [
    StoreModule,
    MongooseModule.forFeature([{ name: DBAccount.name, schema: AccountSchema }, { name: DBChat.name, schema: ChatSchema }]),
    ScheduleModule.forRoot(),
  ],
  providers: [UserGateway, ConnectionManagerService, StoreService, ChatAssignmentService],
  exports: [UserGateway, ConnectionManagerService, StoreService, ChatAssignmentService],
})
export class UserModule {}
