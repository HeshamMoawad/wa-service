import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {Chat} from '@whiskeysockets/baileys'


// Main Chat Schema - Updated with optional fields and defaults
@Schema({ timestamps: true, validateBeforeSave: false })
export class DBChat extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Phone', required: true })
    phone: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Contact' })
    contact?: Types.ObjectId;

    @Prop({ type: Object, required: true })
    chat: Chat;
}

export const ChatSchema = SchemaFactory.createForClass(DBChat);

// Create indexes
ChatSchema.removeIndex('chat.id');
ChatSchema.removeIndex('chat.lastMessageRecvTimestamp');
ChatSchema.removeIndex('chat.messages.message.key.id');