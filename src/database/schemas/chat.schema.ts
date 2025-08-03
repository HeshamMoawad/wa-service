import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Chat } from 'whatsapp-web.js';


// Main Chat Schema - Updated with optional fields and defaults
@Schema({ timestamps: true, validateBeforeSave: false })
export class DBChat extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Phone', required: true })
    phone: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Contact' })
    contact?: Types.ObjectId;

    @Prop({ type: Object, required: true })
    chat: Chat;

    @Prop({ type: Types.ObjectId, ref: 'DBAccount' })
    user?: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(DBChat);

// Create indexes
ChatSchema.removeIndex('chat.id');
ChatSchema.removeIndex('chat.lastMessageRecvTimestamp');
ChatSchema.removeIndex('chat.messages.message.key.id');