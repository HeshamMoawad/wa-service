import { Chat } from 'whatsapp-web.js';

export const WFM_URL = 'http://wfm.m.local/api/users/whatsapp-number';

export const pushWFM = (account: string, user: string, chats: Chat[]) => {
  console.log('Pushing to WFM', account, user, chats.length);
  fetch(WFM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account, user, chats }),
  })
    .then(async (res) => console.log(await res.text()))
    .catch((err) => console.log(err));
};
