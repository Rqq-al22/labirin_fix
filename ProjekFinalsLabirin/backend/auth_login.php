<?php
declare(strict_types=1);
require_once __DIR__.'/config.php';

/* ========================================
   LOGIN PROCESS - Proses autentikasi user
   ======================================== */

// Ambil data dari request JSON
$body = read_json_body();
$login = trim((string)($body['login'] ?? ''));
$password = (string)($body['password'] ?? '');

// Validasi input - cek apakah username dan password tidak kosong
if ($login === '' || $password === '') {
    json_response(400, ['ok' => false, 'error' => 'MISSING_CREDENTIALS']);
}

// Cari user di database berdasarkan username
$stmt = $pdo->prepare('SELECT user_id, username, password, role, nama_lengkap FROM users WHERE username = ? LIMIT 1');
$stmt->execute([$login]);
$user = $stmt->fetch();

// Validasi password - cek apakah user ada dan password benar
if (!$user || !password_matches($password, (string)$user['password'])) {
    json_response(401, ['ok' => false, 'error' => 'INVALID_LOGIN']);
}

// Buat session user jika login berhasil
$_SESSION['user'] = [
    'id' => (int)$user['user_id'],
    'username' => (string)$user['username'],
    'name' => (string)$user['nama_lengkap'],
    'role' => (string)$user['role']
];

// Return response sukses dengan data user
json_response(200, ['ok' => true, 'user' => $_SESSION['user']]);
