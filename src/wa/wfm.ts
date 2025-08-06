import { Chat } from "whatsapp-web.js";

export const WFM_URL = "http://192.168.11.250:8000/api/users/whatsapp-number";


export const pushWFM = ( account: string,user:string, chats:Chat[]) => {
    console.log("Pushing to WFM", account, user, chats.length);
    fetch(WFM_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account, user, chats }),
    }).then(res => console.log(res.text())).catch(err => console.log(err));
}