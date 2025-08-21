import { Chat } from 'whatsapp-web.js';

export const WFM_URL = 'http://192.168.11.235/api/users/whatsapp-number';

export const pushWFM = (account: string, user: string, chats: Chat[]) => {
  console.log('Pushing to WFM', account, user, chats.length);
  try {
    fetch(WFM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account, user, chats }),
    })
      .then(async (res) => console.log(await res.text()))
      .catch((err) => console.log("Error pushing to WFM",err));
  } catch (error) {
    console.log("Error pushing to WFM",error);
  }
};
