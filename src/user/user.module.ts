import { Module } from '@nestjs/common';
import { UserGateway } from './user.gateway';
import { ConnectionManagerService } from './connection-manager.service';
import { StoreService } from 'src/store/store.service';
import { StoreModule } from 'src/store/store.module';


@Module({
    imports:[StoreModule],
    providers: [UserGateway, ConnectionManagerService,StoreService],
    exports: [UserGateway, ConnectionManagerService,StoreService],
})
export class UserModule {}
