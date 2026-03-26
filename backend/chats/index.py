"""Чаты: список, создание, личные диалоги и группы"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    action = params.get('action', 'list')

    auth_header = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip() if auth_header else None

    conn = get_conn()
    user = get_user_by_token(conn, token) if token else None
    if not user:
        conn.close()
        return err('Не авторизован', 401)

    if action == 'direct' and method == 'POST':
        target_id = body.get('target_user_id')
        if not target_id:
            conn.close()
            return err('target_user_id обязателен')

        cur = conn.cursor()
        cur.execute(
            "SELECT c.id FROM chats c "
            "JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s "
            "JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s "
            "WHERE c.type = 'direct'",
            (user['id'], target_id)
        )
        row = cur.fetchone()
        if row:
            chat_id = row[0]
        else:
            cur.execute(
                "INSERT INTO chats (type, name, created_by) VALUES ('direct', 'direct', %s) RETURNING id",
                (user['id'],)
            )
            chat_id = cur.fetchone()[0]
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user['id']))
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, target_id))
            conn.commit()

        cur.execute(
            "SELECT u.id, u.username, u.display_name, u.bio, u.is_online FROM users u WHERE u.id = %s",
            (target_id,)
        )
        other = cur.fetchone()
        cur.execute("SELECT created_at FROM chats WHERE id = %s", (chat_id,))
        chat_row = cur.fetchone()
        cur.close(); conn.close()

        other_user = None
        if other:
            other_user = {'id': other[0], 'username': other[1], 'display_name': other[2], 'bio': other[3], 'is_online': other[4]}

        return ok({'chat': {
            'id': chat_id, 'type': 'direct', 'name': other_user['display_name'] if other_user else 'Чат',
            'unread_count': 0, 'members_count': 2,
            'other_user': other_user,
            'created_at': chat_row[0].isoformat() if chat_row else ''
        }})

    elif action == 'create' and method == 'POST':
        name = body.get('name', '').strip()
        chat_type = body.get('type', 'group')
        if not name:
            conn.close()
            return err('Укажите название')
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chats (type, name, created_by) VALUES (%s, %s, %s) RETURNING id, created_at",
            (chat_type, name, user['id'])
        )
        chat_id, created_at = cur.fetchone()
        cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user['id']))
        conn.commit(); cur.close(); conn.close()
        return ok({'chat': {'id': chat_id, 'type': chat_type, 'name': name, 'unread_count': 0, 'members_count': 1, 'created_at': created_at.isoformat()}})

    else:
        # GET list
        cur = conn.cursor()
        cur.execute(
            "SELECT c.id, c.type, c.name, c.created_at, "
            "   (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) as members, "
            "   (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread "
            "FROM chats c "
            "JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s "
            "ORDER BY (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) DESC NULLS LAST",
            (user['id'], user['id'])
        )
        rows = cur.fetchall()
        chats = []
        for row in rows:
            chat_id, chat_type, name, created_at, members, unread = row
            chat_data = {
                'id': chat_id, 'type': chat_type, 'name': name,
                'created_at': created_at.isoformat(),
                'members_count': members, 'unread_count': unread,
                'other_user': None, 'last_message': None
            }
            if chat_type == 'direct':
                cur.execute(
                    "SELECT u.id, u.username, u.display_name, u.is_online FROM users u "
                    "JOIN chat_members cm ON cm.user_id = u.id "
                    "WHERE cm.chat_id = %s AND u.id != %s LIMIT 1",
                    (chat_id, user['id'])
                )
                other = cur.fetchone()
                if other:
                    chat_data['other_user'] = {'id': other[0], 'username': other[1], 'display_name': other[2], 'is_online': other[3]}

            cur.execute(
                "SELECT id, sender_id, content, created_at, is_read FROM messages WHERE chat_id = %s ORDER BY created_at DESC LIMIT 1",
                (chat_id,)
            )
            last = cur.fetchone()
            if last:
                chat_data['last_message'] = {
                    'id': last[0], 'sender_id': last[1], 'content': last[2],
                    'created_at': last[3].isoformat(), 'is_read': last[4],
                    'chat_id': chat_id
                }
            chats.append(chat_data)

        cur.close(); conn.close()
        return ok({'chats': chats})
