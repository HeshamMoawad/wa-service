import { Controller, Get, Param, Post, Body, Req, Query } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DBAccount } from './schemas/accounts.schema';
import { DBPhone } from './schemas/phone.schema';
import { DBChat } from './schemas/chat.schema';
import { DBMessage } from './schemas/message.schema';

@Controller('database')
export class DatabaseController {
    constructor(
        private readonly databaseService: DatabaseService
    ) {}

    @Get()
    getHello(): Promise<DBAccount[]> {
        return this.databaseService.getAccounts();
    }

    @Get('accounts')
    getAccounts(): Promise<DBAccount[]> {
        return this.databaseService.getAccounts();
    }

    @Post('account')
    addAccount(@Body() account: DBAccount): Promise<DBAccount> {
        return this.databaseService.addAccount(account);
    }

    @Get('phones')
    getPhones(): Promise<DBPhone[]> {
        return this.databaseService.getPhones();
    }

    @Post('phone')
    addPhone(@Body() phone: DBPhone): Promise<DBPhone> {
        return this.databaseService.addPhone(phone);
    }
    
    @Get('chats')
    getChats(): Promise<DBChat[]> {
        return this.databaseService.getChats();
    }

    @Get("messages")
    getMessages(@Query("chatId") chatId: string, @Req() req:Request): Promise<DBMessage[]> {
        return this.databaseService.getMessages(chatId);
    }
}
