"""Авторизация: регистрация, вход, получение профиля"""
import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(32)

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.username, u.display_name, u.bio, u.is_online, u.last_seen, u.created_at "
        "FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {
        'id': row[0], 'username': row[1], 'display_name': row[2],
        'bio': row[3], 'is_online': row[4],
        'last_seen': row[5].isoformat() if row[5] else None,
        'created_at': row[6].isoformat()
    }

def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    auth_header = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip() if auth_header else None

    conn = get_conn()

    if action == 'register' and method == 'POST':
        username = body.get('username', '').strip().lower()
        display_name = body.get('display_name', '').strip()
        password = body.get('password', '')

        if not username or not display_name or not password:
            conn.close()
            return err('Заполните все поля')
        if len(username) < 3:
            conn.close()
            return err('Логин минимум 3 символа')
        if len(password) < 6:
            conn.close()
            return err('Пароль минимум 6 символов')

        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close(); conn.close()
            return err('Пользователь уже существует')

        pw_hash = hash_password(password)
        cur.execute(
            "INSERT INTO users (username, display_name, password_hash) VALUES (%s, %s, %s) RETURNING id, created_at",
            (username, display_name, pw_hash)
        )
        user_id, created_at = cur.fetchone()
        session_token = generate_token()
        expires = datetime.utcnow() + timedelta(days=30)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, session_token, expires)
        )
        conn.commit(); cur.close(); conn.close()

        return ok({
            'token': session_token,
            'user': {'id': user_id, 'username': username, 'display_name': display_name,
                     'bio': None, 'is_online': True, 'last_seen': None,
                     'created_at': created_at.isoformat()}
        })

    elif action == 'login' and method == 'POST':
        username = body.get('username', '').strip().lower()
        password = body.get('password', '')
        pw_hash = hash_password(password)

        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, display_name, bio, created_at FROM users WHERE username = %s AND password_hash = %s",
            (username, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err('Неверный логин или пароль')

        user_id = row[0]
        cur.execute("UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = %s", (user_id,))
        session_token = generate_token()
        expires = datetime.utcnow() + timedelta(days=30)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, session_token, expires)
        )
        conn.commit(); cur.close(); conn.close()

        return ok({
            'token': session_token,
            'user': {'id': user_id, 'username': row[1], 'display_name': row[2],
                     'bio': row[3], 'is_online': True, 'last_seen': None,
                     'created_at': row[4].isoformat()}
        })

    elif action == 'me' and method == 'GET':
        if not token:
            conn.close()
            return err('Не авторизован', 401)
        user = get_user_by_token(conn, token)
        conn.close()
        if not user:
            return err('Не авторизован', 401)
        return ok({'user': user})

    conn.close()
    return err('Не найдено', 404)
