"""Пользователи: поиск и обновление профиля"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
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
    path = event.get('path', '')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')

    auth_header = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip() if auth_header else None

    conn = get_conn()
    user_id = get_user_by_token(conn, token) if token else None
    if not user_id:
        conn.close()
        return err('Не авторизован', 401)

    if path.endswith('/search') and method == 'GET':
        q = params.get('q', '').strip()
        if not q:
            conn.close()
            return ok({'users': []})

        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, display_name, bio, is_online FROM users "
            "WHERE id != %s AND (username ILIKE %s OR display_name ILIKE %s) LIMIT 20",
            (user_id, f'%{q}%', f'%{q}%')
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        users = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'bio': r[3], 'is_online': r[4]} for r in rows]
        return ok({'users': users})

    if path.endswith('/profile') and method == 'PUT':
        display_name = body.get('display_name', '').strip()
        bio = body.get('bio', '').strip()
        if not display_name:
            conn.close()
            return err('Имя обязательно')

        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET display_name = %s, bio = %s WHERE id = %s RETURNING id, username, display_name, bio, is_online, last_seen, created_at",
            (display_name, bio, user_id)
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return ok({'user': {
            'id': row[0], 'username': row[1], 'display_name': row[2],
            'bio': row[3], 'is_online': row[4],
            'last_seen': row[5].isoformat() if row[5] else None,
            'created_at': row[6].isoformat()
        }})

    conn.close()
    return err('Не найдено', 404)