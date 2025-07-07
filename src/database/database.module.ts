import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSchema } from './schemas/chat.schema';
import { ContactSchema } from './schemas/contact.schema';
import { MessageSchema } from './schemas/message.schema';
import { PhoneSchema } from './schemas/phone.schema';
import { AccountSchema } from './schemas/accounts.schema';

@Module({
    imports: [
        MongooseModule.forRoot('mongodb://root:password@localhost:27017/wa-server?authSource=admin'),
        MongooseModule.forFeature([
            { name: 'DBChat', schema: ChatSchema },
            { name: 'DBContact', schema: ContactSchema },
            { name: 'DBMessage', schema: MessageSchema },
            { name: 'DBPhone', schema: PhoneSchema },
            { name: 'DBAccount', schema: AccountSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {}
