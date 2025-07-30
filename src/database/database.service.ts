import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DBChat } from '../database/schemas/chat.schema';
import { DBContact } from '../database/schemas/contact.schema';
import { DBMessage } from '../database/schemas/message.schema';
import { DBPhone } from '../database/schemas/phone.schema';
import {DBAccount} from '../database/schemas/accounts.schema';

@Injectable()
export class DatabaseService {
    constructor(
        @InjectModel(DBPhone.name) private phoneModel: Model<DBPhone>,
        @InjectModel(DBChat.name) private chatModel: Model<DBChat>,
        @InjectModel(DBContact.name) private contactModel: Model<DBContact>,
        @InjectModel(DBMessage.name) private messageModel: Model<DBMessage>,
        @InjectModel(DBAccount.name) private accountModel: Model<DBAccount>,
    ) {}


    async getAccounts() {
        return await this.accountModel.find();
    }
    async getAccountById(id: string) {
        return await this.accountModel.findById(id);
    }
    async getAccountByUUID(uuid: string) {
        return await this.accountModel.findOne({uuid});
    }
    async addAccount(account: DBAccount) {
        return await this.accountModel.create(account);
    }
    async updateAccount(id: string, account: DBAccount) {
        return await this.accountModel.findByIdAndUpdate(id, account);
    }
    async deleteAccount(id: string) {
        return await this.accountModel.findByIdAndDelete(id);
    }
    async getPhones() {
        return await this.phoneModel.find();
    }
    async getPhoneById(id: string) {
        return await this.phoneModel.findById(id);
    }
    async addPhone(phone: DBPhone) {
        return await this.phoneModel.create(phone);
    }
    async updatePhone(id: string, phone: DBPhone) {
        return await this.phoneModel.findByIdAndUpdate(id, phone);
    }
    async deletePhone(id: string) {
        return await this.phoneModel.findByIdAndDelete(id);
    }
    async getChats() {
        return await this.chatModel.find();
    }
    async getChatById(id: string) {
        return await this.chatModel.findById(id);
    }
    async addChat(chat: DBChat) {
        return await this.chatModel.create(chat);
    }
    async updateChat(id: string, chat: DBChat) {
        return await this.chatModel.findByIdAndUpdate(id, chat);
    }
    async deleteChat(id: string) {
        return await this.chatModel.findByIdAndDelete(id);
    }
    async getMessages(chatId?:string) {
        if (chatId){
            console.log(chatId);
            return await this.messageModel.find({chat:chatId});
        }
        return await this.messageModel.find();
    }
    async getMessageById(id: string) {
        return await this.messageModel.findById(id);
    }
    async addMessage(message: DBMessage) {
        return await this.messageModel.create(message);
    }
    async updateMessage(id: string, message: DBMessage) {
        return await this.messageModel.findByIdAndUpdate(id, message);
    }
    async deleteMessage(id: string) {
        return await this.messageModel.findByIdAndDelete(id);
    }
}
