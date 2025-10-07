<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

/* ========================================
   DEBUG SEED ABSENCE - Isi 4x izin untuk akun Ibu Sari (O001)
   - Orangtua: O001 -> user_id=3 (sesuai seed projek1_db.sql)
   - Anak: Ayu -> anak_id=1 (milik orangtua_id=3)
   - Terapis: T001 -> user_id=1
   ======================================== */

header('Content-Type: text/plain; charset=utf-8');

try {
    // Pastikan entity ada
    $u = $pdo->query("SELECT user_id FROM users WHERE username='O001' LIMIT 1")->fetch();
    if (!$u) { throw new RuntimeException('User O001 tidak ditemukan'); }
    $orangtuaId = (int)$u['user_id'];

    $a = $pdo->query("SELECT anak_id FROM anak WHERE orangtua_id={$orangtuaId} LIMIT 1")->fetch();
    if (!$a) { throw new RuntimeException('Anak milik O001 tidak ditemukan'); }
    $anakId = (int)$a['anak_id'];

    $t = $pdo->query("SELECT user_id FROM users WHERE username='T001' LIMIT 1")->fetch();
    if (!$t) { throw new RuntimeException('Terapis T001 tidak ditemukan'); }
    $terapisId = (int)$t['user_id'];

    // Buat 4 record izin pada bulan berjalan (tanggal berbeda)
    $dates = [];
    $base = new DateTime('first day of this month');
    $offsets = [1, 3, 5, 7];
    foreach ($offsets as $d) {
        $dt = clone $base; $dt->modify("+{$d} day");
        $dates[] = $dt->format('Y-m-d');
    }

    $stmt = $pdo->prepare('INSERT INTO absensi (anak_id, terapis_id, tanggal, status, catatan) VALUES (?,?,?,?,?)');
    $inserted = 0;
    foreach ($dates as $tgl) {
        // Hindari duplikasi di tanggal sama
        $check = $pdo->prepare('SELECT absensi_id FROM absensi WHERE anak_id=? AND terapis_id=? AND tanggal=? AND status IN (\'izin\',\'sakit\',\'alpa\')');
        $check->execute([$anakId, $terapisId, $tgl]);
        if ($check->fetch()) { continue; }
        $stmt->execute([$anakId, $terapisId, $tgl, 'izin', 'Debug seed izin']);
        $inserted++;
    }

    echo "OK - Inserted {$inserted} izin records for O001/Ayu in current month.\n";
    echo "Cek notifikasi di: backend/notifications.php (sudah login) atau klik ikon 🔔.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage();
}

?>


