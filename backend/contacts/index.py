"""Контакты: список и добавление"""
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
        "SELECT u.id FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None

def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')

    auth_header = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip() if auth_header else None

    conn = get_conn()
    user_id = get_user_by_token(conn, token) if token else None
    if not user_id:
        conn.close()
        return err('Не авторизован', 401)

    if method == 'GET':
        cur = conn.cursor()
        cur.execute(
            "SELECT u.id, u.username, u.display_name, u.bio, u.is_online, u.created_at "
            "FROM contacts c JOIN users u ON u.id = c.contact_id "
            "WHERE c.user_id = %s ORDER BY u.display_name",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        contacts = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'bio': r[3], 'is_online': r[4], 'created_at': r[5].isoformat()} for r in rows]
        return ok({'contacts': contacts})

    elif method == 'POST':
        username = body.get('username', '').strip().lower()
        if not username:
            conn.close()
            return err('Укажите username')

        cur = conn.cursor()
        cur.execute("SELECT id, username, display_name, bio, is_online FROM users WHERE username = %s AND id != %s", (username, user_id))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err('Пользователь не найден')

        contact_id = row[0]
        cur.execute("SELECT 1 FROM contacts WHERE user_id = %s AND contact_id = %s", (user_id, contact_id))
        if cur.fetchone():
            cur.close(); conn.close()
            return err('Уже в контактах')

        cur.execute("INSERT INTO contacts (user_id, contact_id) VALUES (%s, %s)", (user_id, contact_id))
        conn.commit(); cur.close(); conn.close()
        return ok({'contact': {'id': row[0], 'username': row[1], 'display_name': row[2], 'bio': row[3], 'is_online': row[4]}})

    conn.close()
    return err('Метод не поддерживается', 405)
