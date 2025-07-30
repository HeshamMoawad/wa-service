// schemas/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DBChat } from './chat.schema';

export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Schema({ timestamps: true })
export class DBAccount extends Document {
    @Prop({
        type: String,
        default: () => uuidv4(),
        required: true,
        unique: true,
        index: true
        })
    uuid: string; // This will be our UUID primary key
    
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true , enum: Role,  default: Role.USER})
    role: string;
}

@Schema({ timestamps: true })
export class AccountChats extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
    account: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
    chat: Types.ObjectId;

    
}


export const AccountSchema = SchemaFactory.createForClass(DBAccount);
export const AccountChatsSchema = SchemaFactory.createForClass(AccountChats);

