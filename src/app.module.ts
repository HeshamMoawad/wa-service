import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { WaService } from './wa/wa.service';
import { WaModule } from './wa/wa.module';
import { StoreService } from './store/store.service';
import { StoreModule } from './store/store.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/configurations';

@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [config],
        envFilePath: '.env',
      },
    ), // This loads .env file automatically
    AccountsModule,
    WaModule,
    StoreModule,
    UserModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, WaService, StoreService],
})
export class AppModule {}
