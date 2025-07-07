import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import {WAMessage} from '@whiskeysockets/baileys'


@Schema({ timestamps: true, validateBeforeSave: false })
export class DBMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Phone', required: true })
  phone: Types.ObjectId;

  @Prop({type:Types.ObjectId, ref: 'Chat', required: true})
  chat: Types.ObjectId;

  @Prop({type:Object})
  message: WAMessage;
}

export const MessageSchema = SchemaFactory.createForClass(DBMessage);

// Add compound index for efficient querying
MessageSchema.index({ 'message.key.remoteJid': 1, 'message.messageTimestamp': -1 });
MessageSchema.index({ 'message.key.id': 1 }, { unique: true });