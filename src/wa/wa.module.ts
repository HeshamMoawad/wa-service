import { Module } from '@nestjs/common';
import { WaService } from './wa.service';
import { WaStateService } from './waState.service';
import { WaGateway } from './wa.gateway';
import { StoreService } from 'src/store/store.service';
import { StoreModule } from 'src/store/store.module';
import { DatabaseModule } from 'src/database/database.module';
import { SaverService } from 'src/database/saver.service';

@Module({
    imports:[StoreModule,DatabaseModule],
    providers: [WaService, WaStateService,StoreService,WaGateway,SaverService],
    exports: [WaService, WaStateService,StoreService,WaGateway,SaverService],
})
export class WaModule {}
