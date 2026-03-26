"""Сообщения: получение и отправка через chat_id в query"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.username, u.display_name FROM users u "
        "JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return {'id': row[0], 'username': row[1], 'display_name': row[2]} if row else None

def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}

    auth_header = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip() if auth_header else None

    conn = get_conn()
    user = get_user_by_token(conn, token) if token else None
    if not user:
        conn.close()
        return err('Не авторизован', 401)

    chat_id_str = params.get('chat_id', '')
    if not chat_id_str:
        conn.close()
        return err('chat_id обязателен')

    try:
        chat_id = int(chat_id_str)
    except ValueError:
        conn.close()
        return err('Некорректный chat_id')

    cur = conn.cursor()
    cur.execute("SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user['id']))
    if not cur.fetchone():
        cur.close(); conn.close()
        return err('Нет доступа', 403)

    if method == 'GET':
        cur.execute(
            "SELECT m.id, m.sender_id, m.content, m.message_type, m.created_at, m.is_read, "
            "u.display_name, u.username "
            "FROM messages m JOIN users u ON u.id = m.sender_id "
            "WHERE m.chat_id = %s ORDER BY m.created_at ASC LIMIT 100",
            (chat_id,)
        )
        rows = cur.fetchall()
        messages = [{
            'id': r[0], 'sender_id': r[1], 'content': r[2], 'message_type': r[3],
            'created_at': r[4].isoformat(), 'is_read': r[5], 'chat_id': chat_id,
            'sender': {'id': r[1], 'display_name': r[6], 'username': r[7]}
        } for r in rows]

        cur.execute(
            "UPDATE messages SET is_read = TRUE WHERE chat_id = %s AND sender_id != %s AND is_read = FALSE",
            (chat_id, user['id'])
        )
        conn.commit(); cur.close(); conn.close()
        return ok({'messages': messages})

    elif method == 'POST':
        content = body.get('content', '').strip()
        if not content:
            cur.close(); conn.close()
            return err('Сообщение не может быть пустым')

        cur.execute(
            "INSERT INTO messages (chat_id, sender_id, content, message_type) VALUES (%s, %s, %s, 'text') RETURNING id, created_at",
            (chat_id, user['id'], content)
        )
        msg_id, created_at = cur.fetchone()
        conn.commit(); cur.close(); conn.close()

        return ok({'message': {
            'id': msg_id, 'chat_id': chat_id, 'sender_id': user['id'],
            'content': content, 'message_type': 'text',
            'created_at': created_at.isoformat(), 'is_read': False,
            'sender': {'id': user['id'], 'display_name': user['display_name'], 'username': user['username']}
        }})

    cur.close(); conn.close()
    return err('Метод не поддерживается', 405)
