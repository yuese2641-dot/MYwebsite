const SUPABASE_URL = 'https://hjltrmoysrrdcepgaxkc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H-WKWrtigBvD8OoxyB7U4w_8ffM1GdY';
const REST_URL = `${SUPABASE_URL}/rest/v1/guestbook`;

const form = document.querySelector('#guestbook-form');
const list = document.querySelector('#guestbook-list');
const count = document.querySelector('#guestbook-count');
const status = document.querySelector('#guestbook-status');
const submitButton = form.querySelector('button[type="submit"]');

async function requestMessages(options = {}) {
    const response = await fetch(options.url || `${REST_URL}?select=id,name,message,created_at&order=created_at.desc&limit=100`, {
        method: options.method || 'GET',
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            ...(options.method === 'POST' ? { Prefer: 'return=representation' } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) {
        let detail = '';
        try { detail = (await response.json()).message || ''; } catch {}
        throw new Error(detail || `请求失败（${response.status}）`);
    }
    return response.status === 204 ? null : response.json();
}

function renderMessages(messages) {
    count.textContent = `${messages.length} 条`;
    list.replaceChildren();
    if (!messages.length) {
        const empty = document.createElement('li');
        empty.className = 'guestbook-empty';
        empty.textContent = '还没有留言，来写第一条吧。';
        list.append(empty);
        return;
    }
    messages.forEach(message => {
        const item = document.createElement('li');
        item.className = 'guestbook-item';
        const author = document.createElement('strong');
        author.textContent = message.name || '访客';
        const time = document.createElement('time');
        time.dateTime = message.created_at;
        time.textContent = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(message.created_at));
        const body = document.createElement('p');
        body.textContent = message.message;
        item.append(author, time, body);
        list.append(item);
    });
}

async function refreshMessages() {
    try {
        renderMessages(await requestMessages());
        status.textContent = '留言会公开显示，请不要填写隐私信息。';
    } catch (error) {
        status.textContent = `暂时无法读取留言：${error.message}。请确认 Supabase 表和访问策略已设置。`;
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = String(data.get('message') || '').trim();
    if (!message) return;
    submitButton.disabled = true;
    status.textContent = '正在发布……';
    try {
        await requestMessages({ method: 'POST', body: {
            name: String(data.get('name') || '').trim().slice(0, 30) || '访客',
            message: message.slice(0, 500)
        }});
        form.reset();
        status.textContent = '留言发布成功。';
        await refreshMessages();
    } catch (error) {
        status.textContent = `发布失败：${error.message}。请确认 Supabase 表和访问策略已设置。`;
    } finally {
        submitButton.disabled = false;
    }
});

refreshMessages();
