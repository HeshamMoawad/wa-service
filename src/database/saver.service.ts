import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat , Contact , WAMessage } from '@whiskeysockets/baileys';
import { DBChat } from '../database/schemas/chat.schema';
import { DBContact } from '../database/schemas/contact.schema';
import { DBMessage } from '../database/schemas/message.schema';
import { DBPhone } from '../database/schemas/phone.schema';
import {DBAccount} from '../database/schemas/accounts.schema';


@Injectable()
export class SaverService {
    constructor(
        @InjectModel(DBPhone.name) private phoneModel: Model<DBPhone>,
        @InjectModel(DBChat.name) private chatModel: Model<DBChat>,
        @InjectModel(DBContact.name) private contactModel: Model<DBContact>,
        @InjectModel(DBMessage.name) private messageModel: Model<DBMessage>,
    ) {}

    async savePhone(phone: {phoneNumber: string , jid: string}) {
        const phoneData = await this.phoneModel.find({phoneNumber: phone.phoneNumber});
        if(phoneData.length > 0){
            return phoneData[0];
        }
        const newPhone = await this.phoneModel.create(phone);
        return newPhone;
    }

    async saveChat(chat: Chat , phone: string|number , contact?: string|number) {
        const data = {
            phone: phone,
            contact: contact,
            chat: chat
        }
        const newChat = await this.chatModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        return newChat;
    }
    async saveContact(contact: Contact , phone: string|number , contactId: string|number) {
        const data = {
            phone: phone,
            contact: contactId,
        }
        const newContact = await this.contactModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        return newContact;
    }
    async saveMessage(message: WAMessage , phone: string|number ) {
        const data = {
            phone: phone,
            chat: message.key.remoteJid,
            message: message
        }
        const newMessage = await this.messageModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        return newMessage;
    }
    async saveChats(chats: Chat[] , phone: string|number , contact?: string|number) {
        const data = chats.map(chat => {
            return {
                phone: phone,
                contact: contact,
                chat: chat
            }
        })
        const newChats = await this.chatModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        return newChats;
    }
    async saveContacts(contacts: Contact[] , phone: string|number) {
        const data = contacts.map(contact => {
            return {
                phone: phone,
                contact: contact
            }
        })
        const newContacts = await this.contactModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        return newContacts;
    }
    async saveMessages(messages: WAMessage[] , phone: string|number) {
        const data = messages.map(message => {
            return {
                phone: phone,
                chat: message.key.remoteJid,
                message: message
            }
        })
        const newMessages = await this.messageModel.insertMany(data,{
            ordered: false // Continue on errors
        });
        console.log(newMessages);
        return newMessages;
    }
}
