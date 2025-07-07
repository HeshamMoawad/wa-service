import {DBContact} from './schemas/contact.schema';


export const convertPhoneToJid = (phone:string) => {
    if (phone.startsWith("+")) {
        phone = phone.replace("+","");
    }
    if (!phone.endsWith("@s.whatsapp.net")) {
        phone = phone + "@s.whatsapp.net";
    }
    return phone;
}

export const convertJidToPhone = (phone:string) => {
    if (phone.endsWith("@s.whatsapp.net")) {
        phone = phone.replace("@s.whatsapp.net","");
    }
    return `+${phone}`;
}

export const displayName = (contact: DBContact) => {
    return contact.contact.name || contact.contact.notify || contact.contact.verifiedName || `+${contact.contact.id.replace("@s.whatsapp.net","")}`;
}