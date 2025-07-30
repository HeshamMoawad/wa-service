import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { Message } from 'whatsapp-web.js';


@Schema({ timestamps: true, validateBeforeSave: false })
export class DBMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Phone', required: true })
  phone: Types.ObjectId;

  @Prop({type:Types.ObjectId, ref: 'Chat', required: true})
  chat: Types.ObjectId;

  @Prop({type:Object})
  message: Message;
}

export const MessageSchema = SchemaFactory.createForClass(DBMessage);

// Add compound index for efficient querying
MessageSchema.index({ 'message.id.id': 1 }, { unique: true });
