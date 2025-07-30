import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSchema } from './schemas/chat.schema';
import { ContactSchema } from './schemas/contact.schema';
import { MessageSchema } from './schemas/message.schema';
import { PhoneSchema } from './schemas/phone.schema';
import { AccountSchema, AccountChatsSchema } from './schemas/accounts.schema';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';

@Module({
    imports: [
        MongooseModule.forRoot('mongodb://root:password@localhost:27017/wa-server?authSource=admin'),
        MongooseModule.forFeature([
            { name: 'DBChat', schema: ChatSchema },
            { name: 'DBContact', schema: ContactSchema },
            { name: 'DBMessage', schema: MessageSchema },
            { name: 'DBPhone', schema: PhoneSchema },
            { name: 'DBAccount', schema: AccountSchema },
            { name: 'DBAccountChats', schema: AccountChatsSchema },
        ]),
    ],
    exports: [MongooseModule],
    controllers: [DatabaseController],
    providers: [DatabaseService],
})
export class DatabaseModule {}
