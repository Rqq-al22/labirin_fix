<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

/* ========================================
   NOTIFICATIONS ENDPOINT - Peringatan ketidakhadiran
   Mengembalikan notifikasi jika jumlah "tidak hadir" (izin/sakit/alpa)
   dalam bulan berjalan sudah mencapai/lebih dari 4 kali.
   ======================================== */

$user = current_user();
if (!$user) {
    json_response(401, ['ok' => false, 'error' => 'UNAUTHORIZED']);
}

// Hitung rentang tanggal bulan berjalan
$startOfMonth = (new DateTime('first day of this month 00:00:00'))->format('Y-m-d');
$endOfMonth = (new DateTime('last day of this month 23:59:59'))->format('Y-m-d');

$items = [];

try {
    if (is_parent_role($user)) {
        // Orangtua: hitung akumulasi ketidakhadiran untuk semua anak miliknya pada bulan ini
        $sql = "
            SELECT a.nama_anak, COUNT(*) AS total
            FROM absensi ab
            JOIN anak a ON a.anak_id = ab.anak_id
            WHERE a.orangtua_id = ?
              AND ab.tanggal BETWEEN ? AND ?
              AND ab.status IN ('izin','sakit','alpa')
            GROUP BY ab.anak_id, a.nama_anak
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['id'], $startOfMonth, $endOfMonth]);
        $rows = $stmt->fetchAll();

        foreach ($rows as $row) {
            $total = (int)$row['total'];
            if ($total >= 4) {
                $items[] = [
                    'id' => 'absent-parent-' . md5($row['nama_anak'] . $total . $startOfMonth),
                    'title' => 'Peringatan Ketidakhadiran',
                    'message' => "Anak {$row['nama_anak']} sudah tidak hadir {$total} kali bulan ini. Hak reschedule bulan ini hangus.",
                    'severity' => 'warning',
                ];
            }
        }
    } else if (is_staff_role($user)) {
        // Terapis: tampilkan daftar anak yang mencapai threshold pada jadwalnya
        $sql = "
            SELECT a.nama_anak, u.nama_lengkap AS orangtua, COUNT(*) AS total
            FROM absensi ab
            JOIN anak a ON a.anak_id = ab.anak_id
            JOIN users u ON u.user_id = a.orangtua_id
            WHERE ab.terapis_id = ?
              AND ab.tanggal BETWEEN ? AND ?
              AND ab.status IN ('izin','sakit','alpa')
            GROUP BY ab.anak_id, a.nama_anak, u.nama_lengkap
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['id'], $startOfMonth, $endOfMonth]);
        $rows = $stmt->fetchAll();

        foreach ($rows as $row) {
            $total = (int)$row['total'];
            if ($total >= 4) {
                $items[] = [
                    'id' => 'absent-staff-' . md5($row['nama_anak'] . $total . $startOfMonth),
                    'title' => 'Ketidakhadiran Anak Binaan',
                    'message' => "{$row['nama_anak']} (ortu: {$row['orangtua']}) tidak hadir {$total} kali bulan ini. Hak reschedule bulan ini hangus.",
                    'severity' => 'warning',
                ];
            }
        }
    }
} catch (Throwable $e) {
    json_response(500, ['ok' => false, 'error' => 'QUERY_ERROR', 'detail' => $e->getMessage()]);
}

json_response(200, [
    'ok' => true,
    'items' => $items,
    'range' => [
        'start' => $startOfMonth,
        'end' => $endOfMonth,
    ],
]);

?>


