<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

/* ========================================
   RESCHEDULE STATUS - Cek apakah orangtua diblokir reschedule
   Kriteria: total ketidakhadiran (izin/sakit/alpa) bulan berjalan >= 4
   ======================================== */

$user = current_user();
if (!$user) {
    json_response(401, ['ok' => false, 'error' => 'UNAUTHORIZED']);
}

// Hanya relevan untuk role orangtua; staf selalu tidak diblokir
if (!is_parent_role($user)) {
    json_response(200, ['ok' => true, 'blocked' => false, 'count' => 0]);
}

// Ambil anak milik orangtua
$stmt = $pdo->prepare('SELECT anak_id, nama_anak FROM anak WHERE orangtua_id = ?');
$stmt->execute([$user['id']]);
$children = $stmt->fetchAll();

$start = (new DateTime('first day of this month 00:00:00'))->format('Y-m-d');
$end   = (new DateTime('last day of this month 23:59:59'))->format('Y-m-d');

$total = 0;
foreach ($children as $child) {
    $q = $pdo->prepare("SELECT COUNT(*) AS c FROM absensi WHERE anak_id=? AND tanggal BETWEEN ? AND ? AND status IN ('izin','sakit','alpa')");
    $q->execute([(int)$child['anak_id'], $start, $end]);
    $row = $q->fetch();
    $total += (int)($row['c'] ?? 0);
}

$blocked = $total >= 4;
json_response(200, [
    'ok' => true,
    'blocked' => $blocked,
    'count' => $total,
    'range' => ['start'=>$start,'end'=>$end],
]);

?>


