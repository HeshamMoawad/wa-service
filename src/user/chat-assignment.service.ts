import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DBAccount, Role } from '../database/schemas/accounts.schema';
import { DBChat } from '../database/schemas/chat.schema';

@Injectable()
export class ChatAssignmentService {
    private readonly logger = new Logger(ChatAssignmentService.name);

    constructor(
        @InjectModel(DBAccount.name) private readonly accountModel: Model<DBAccount>,
        @InjectModel(DBChat.name) private readonly chatModel: Model<DBChat>,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Running chat assignment cron job');
        await this.assignChatsToUsers();
    }

    async assignChatsToUsers() {
        try {
            const users = await this.accountModel.find({ role: Role.USER }).exec();
            if (users.length === 0) {
                this.logger.warn('No users found to assign chats to.');
                return;
            }

            const unassignedChats = await this.chatModel.find({ user: { $exists: false } }).exec();
            if (unassignedChats.length === 0) {
                this.logger.debug('No unassigned chats to process.');
                return;
            }

            this.logger.log(`Found ${unassignedChats.length} unassigned chats. Assigning to ${users.length} users.`);

            let userIndex = 0;
            for (const chat of unassignedChats) {
                const userToAssign = users[userIndex];
                chat.user = userToAssign._id as any;
                await chat.save();

                userIndex = (userIndex + 1) % users.length; // Move to the next user in a round-robin fashion
            }

            this.logger.log('Finished assigning chats.');
        } catch (error) {
            this.logger.error('Error assigning chats to users', error.stack);
        }
    }
}
