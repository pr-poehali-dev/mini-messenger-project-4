const AUTH_URL = 'https://functions.poehali.dev/3b41fb2a-5e8a-4184-8d10-8e6a641dde09';
const CHATS_URL = 'https://functions.poehali.dev/b5239fdb-6edd-4a18-92be-84a8ba51e95f';
const MESSAGES_URL = 'https://functions.poehali.dev/8a720883-a777-4910-9fff-86adde38ff99';
const CONTACTS_URL = 'https://functions.poehali.dev/7bba2e1f-9930-431d-b53b-f60b28d41207';
const USERS_URL = 'https://functions.poehali.dev/a452e1fe-bb60-4d4c-b037-a1b50a0372dc';

function h(token?: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  auth: {
    register: (data: { username: string; display_name: string; password: string }) =>
      fetch(`${AUTH_URL}/register`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

    login: (data: { username: string; password: string }) =>
      fetch(`${AUTH_URL}/login`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

    me: (token: string) =>
      fetch(`${AUTH_URL}/me`, { headers: h(token) }).then(r => r.json()),
  },

  chats: {
    list: (token: string) =>
      fetch(`${CHATS_URL}/`, { headers: h(token) }).then(r => r.json()),

    create: (token: string, data: { type: string; name: string }) =>
      fetch(`${CHATS_URL}/`, { method: 'POST', headers: h(token), body: JSON.stringify(data) }).then(r => r.json()),

    createDirect: (token: string, target_user_id: number) =>
      fetch(`${CHATS_URL}/direct`, { method: 'POST', headers: h(token), body: JSON.stringify({ target_user_id }) }).then(r => r.json()),
  },

  messages: {
    list: (token: string, chatId: number) =>
      fetch(`${MESSAGES_URL}/chats/${chatId}/messages`, { headers: h(token) }).then(r => r.json()),

    send: (token: string, chatId: number, content: string) =>
      fetch(`${MESSAGES_URL}/chats/${chatId}/messages`, {
        method: 'POST', headers: h(token), body: JSON.stringify({ content })
      }).then(r => r.json()),
  },

  contacts: {
    list: (token: string) =>
      fetch(`${CONTACTS_URL}/`, { headers: h(token) }).then(r => r.json()),

    add: (token: string, username: string) =>
      fetch(`${CONTACTS_URL}/`, { method: 'POST', headers: h(token), body: JSON.stringify({ username }) }).then(r => r.json()),
  },

  users: {
    search: (token: string, q: string) =>
      fetch(`${USERS_URL}/search?q=${encodeURIComponent(q)}`, { headers: h(token) }).then(r => r.json()),

    updateProfile: (token: string, data: { display_name: string; bio: string }) =>
      fetch(`${USERS_URL}/profile`, { method: 'PUT', headers: h(token), body: JSON.stringify(data) }).then(r => r.json()),
  },
};
