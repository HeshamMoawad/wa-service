// schemas/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';



@Schema({ timestamps: true })
export class DBPhone extends Document{

    @Prop({ type: String, required: true ,unique: true , primary: true})
    name: string;
    
    @Prop({ type: String, required: true  ,unique: true , primary: true})
    phoneNumber: string;

    @Prop({ type: String, required: true ,unique: true , primary: true})
    jid: string;

}



export const PhoneSchema = SchemaFactory.createForClass(DBPhone);



PhoneSchema.index({ 'phoneNumber': 1, 'jid': 1 }, { unique: true });