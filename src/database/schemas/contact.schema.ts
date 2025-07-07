import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Contact } from '@whiskeysockets/baileys';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class DBContact extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Phone',
    required: true
  })
  phone: Types.ObjectId;


  @Prop({
    type: Object,
    required: true
  })
  contact: Contact;
}

export const ContactSchema = SchemaFactory.createForClass(DBContact);
