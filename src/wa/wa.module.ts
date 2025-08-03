import { Module } from '@nestjs/common';
import { WaService } from './wa.service';

import { WaGateway } from './wa.gateway';
import { StoreService } from 'src/store/store.service';
import { StoreModule } from 'src/store/store.module';
import { DatabaseModule } from 'src/database/database.module';
import { SaverService } from 'src/database/saver.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DBChat, ChatSchema } from 'src/database/schemas/chat.schema';

@Module({
  imports: [DatabaseModule, StoreModule, MongooseModule.forFeature([{ name: DBChat.name, schema: ChatSchema }])],
  providers: [WaService, StoreService, WaGateway, SaverService],
  exports: [WaService, StoreService, WaGateway, SaverService],
})
export class WaModule {}
