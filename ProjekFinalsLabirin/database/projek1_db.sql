-- =====================================================
-- DATABASE SETUP - Buat database utama
-- =====================================================
CREATE DATABASE IF NOT EXISTS projek1_db;
USE projek1_db;

-- =====================================================
-- TABEL USERS - Data login untuk terapis dan orangtua
-- =====================================================
-- Tabel ini menyimpan data user yang bisa login ke sistem
-- Role: 'terapis' = staff klinik, 'orangtua' = wali anak
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,           -- ID unik user
    username VARCHAR(50) UNIQUE NOT NULL,             -- Username untuk login (T001, O001, dll)
    password VARCHAR(255) NOT NULL,                   -- Password (bisa plain text atau hash)
    email VARCHAR(100) UNIQUE NOT NULL,               -- Email user
    role ENUM('terapis','orangtua') NOT NULL,         -- Role user dalam sistem
    nama_lengkap VARCHAR(100),                        -- Nama lengkap user
    reset_token VARCHAR(255) NULL,                    -- Token untuk reset password
    reset_token_expires TIMESTAMP NULL,               -- Expiry token reset
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Waktu pembuatan akun
);

-- Contoh data awal
INSERT INTO users (username, password, email, role, nama_lengkap) VALUES
('T001', 'Oke2222', 'rezkialya0909@gmail.com', 'terapis', 'Budi Terapis'),
('T002', 'Oke3333', 'terapis2@labirin.com', 'terapis', 'Sinta Terapis'),
('O001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'orangtua1@labirin.com', 'orangtua', 'Ibu Sari'),
('O002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'orangtua2@labirin.com', 'orangtua', 'Pak Andi');

-- =====================================================
-- TABEL PARENT_THERAPIST - Relasi orangtua dan terapis
-- =====================================================
-- Tabel ini menghubungkan orangtua dengan terapis yang menangani anaknya
-- Satu orangtua bisa punya beberapa terapis, satu terapis bisa menangani beberapa orangtua
CREATE TABLE parent_therapist (
    id INT AUTO_INCREMENT PRIMARY KEY,                    -- ID unik relasi
    orangtua_id INT NOT NULL,                             -- ID orangtua (foreign key ke users)
    terapis_id INT NOT NULL,                              -- ID terapis (foreign key ke users)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Waktu pembuatan relasi
    UNIQUE KEY uq_parent_therapist (orangtua_id, terapis_id), -- Mencegah duplikasi relasi
    FOREIGN KEY (orangtua_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (terapis_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Contoh relasi: O001 ditangani T001, O002 ditangani T002
INSERT INTO parent_therapist (orangtua_id, terapis_id) VALUES (3,1),(4,2);

-- =====================================================
-- TABEL PASSWORD_RESETS - Reset password
-- =====================================================
-- Tabel untuk menyimpan token reset password
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,                    -- ID unik token
    email VARCHAR(100) NOT NULL,                          -- Email yang request reset
    token VARCHAR(255) NOT NULL,                          -- Token reset password
    expired_at DATETIME NOT NULL,                         -- Waktu kadaluarsa token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP        -- Waktu pembuatan token
);

-- =====================================================
-- TABEL ANAK - Data anak yang diterapi
-- =====================================================
-- Tabel ini menyimpan data anak yang diterapi di klinik
CREATE TABLE anak (
    anak_id INT AUTO_INCREMENT PRIMARY KEY,               -- ID unik anak
    orangtua_id INT NOT NULL,                             -- ID orangtua (foreign key ke users)
    nama_anak VARCHAR(100) NOT NULL,                      -- Nama lengkap anak
    tanggal_lahir DATE,                                    -- Tanggal lahir anak
    keterangan TEXT,                                       -- Keterangan khusus anak
    FOREIGN KEY (orangtua_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Contoh data anak
INSERT INTO anak (orangtua_id, nama_anak, tanggal_lahir, keterangan) VALUES
(3, 'Ayu', '2018-05-10', 'Perlu terapi wicara'),
(4, 'Bima', '2017-11-22', 'Terapi okupasi');

-- =====================================================
-- TABEL PAKET_BELAJAR - Paket terapi yang dibeli
-- =====================================================
-- Tabel ini menyimpan paket terapi yang dibeli orangtua untuk anaknya
CREATE TABLE paket_belajar (
    paket_id INT AUTO_INCREMENT PRIMARY KEY,               -- ID unik paket
    anak_id INT NOT NULL,                                  -- ID anak (foreign key ke anak)
    nama_paket VARCHAR(100),                               -- Nama paket (Wicara, Okupasi, dll)
    jumlah_pertemuan INT DEFAULT 20,                       -- Jumlah pertemuan dalam paket
    max_reschedule INT DEFAULT 4,                          -- Maksimal izin reschedule
    bulan VARCHAR(20),                                     -- Bulan paket
    tahun INT,                                             -- Tahun paket
    FOREIGN KEY (anak_id) REFERENCES anak(anak_id) ON DELETE CASCADE
);

-- Contoh paket belajar
INSERT INTO paket_belajar (anak_id, nama_paket, jumlah_pertemuan, max_reschedule, bulan, tahun) VALUES
(1, 'Paket Wicara', 20, 4, 'September', 2025),
(2, 'Paket Okupasi', 20, 4, 'September', 2025);

-- =====================================================
-- TABEL ABSENSI - Data kehadiran anak
-- =====================================================
-- Tabel ini menyimpan data kehadiran anak dalam terapi
CREATE TABLE absensi (
    absensi_id INT AUTO_INCREMENT PRIMARY KEY,            -- ID unik absensi
    anak_id INT NOT NULL,                                 -- ID anak (foreign key ke anak)
    terapis_id INT NOT NULL,                              -- ID terapis (foreign key ke users)
    tanggal DATE NOT NULL,                                -- Tanggal absensi
    status ENUM('hadir','izin','sakit','alpa') NOT NULL,  -- Status kehadiran
    catatan TEXT,                                         -- Catatan tambahan
    FOREIGN KEY (anak_id) REFERENCES anak(anak_id) ON DELETE CASCADE,
    FOREIGN KEY (terapis_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Contoh absensi
INSERT INTO absensi (anak_id, terapis_id, tanggal, status, catatan) VALUES
(1, 1, '2025-09-01', 'hadir', 'Pertemuan pertama'),
(1, 1, '2025-09-03', 'izin', 'Sakit flu'),
(2, 2, '2025-09-02', 'hadir', 'Fokus cukup baik');

-- =====================================================
-- TABEL JADWAL - Jadwal terapi
-- =====================================================
-- Tabel ini menyimpan jadwal terapi anak
CREATE TABLE jadwal (
    jadwal_id INT AUTO_INCREMENT PRIMARY KEY,             -- ID unik jadwal
    anak_id INT NOT NULL,                                 -- ID anak (foreign key ke anak)
    terapis_id INT NOT NULL,                              -- ID terapis (foreign key ke users)
    tanggal DATE NOT NULL,                                -- Tanggal terapi
    jam TIME NOT NULL,                                    -- Jam terapi
    sesi VARCHAR(50),                                     -- Nama sesi
    FOREIGN KEY (anak_id) REFERENCES anak(anak_id) ON DELETE CASCADE,
    FOREIGN KEY (terapis_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Contoh jadwal
INSERT INTO jadwal (anak_id, terapis_id, tanggal, jam, sesi) VALUES
(1, 1, '2025-09-05', '09:00:00', 'Sesi 1'),
(1, 1, '2025-09-07', '10:00:00', 'Sesi 2'),
(2, 2, '2025-09-06', '13:00:00', 'Sesi 1');

-- =====================================================
-- TABEL LAPORAN - File laporan terapi (PDF)
-- =====================================================
-- Tabel ini menyimpan file laporan terapi yang diupload terapis
CREATE TABLE laporan (
    laporan_id INT AUTO_INCREMENT PRIMARY KEY,            -- ID unik laporan
    anak_id INT NOT NULL,                                 -- ID anak (foreign key ke anak)
    terapis_id INT NOT NULL,                              -- ID terapis (foreign key ke users)
    pertemuan_ke INT NOT NULL,                            -- Nomor pertemuan
    judul VARCHAR(200),                                   -- Judul laporan
    file_path VARCHAR(255),                               -- Lokasi file PDF
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Waktu upload
    FOREIGN KEY (anak_id) REFERENCES anak(anak_id) ON DELETE CASCADE,
    FOREIGN KEY (terapis_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Contoh laporan
INSERT INTO laporan (anak_id, terapis_id, pertemuan_ke, judul, file_path) VALUES
(1, 1, 1, 'Laporan Pertemuan 1 - Ayu', 'uploads/laporan/ayu_pertemuan1.pdf'),
(2, 2, 1, 'Laporan Pertemuan 1 - Bima', 'uploads/laporan/bima_pertemuan1.pdf');


-- =====================================================
-- TABEL TESTIMONI - Data testimoni dari pengguna
-- =====================================================
-- Tabel ini menyimpan testimoni yang diberikan oleh pengguna/pasien
CREATE TABLE testimoni (
    testimoni_id INT AUTO_INCREMENT PRIMARY KEY,     -- ID unik testimoni
    nama VARCHAR(100) NOT NULL,                       -- Nama pemberi testimoni
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Rating 1-5 bintang
    caption TEXT NOT NULL,                            -- Isi testimoni
    status ENUM('pending','approved','rejected') DEFAULT 'pending', -- Status moderasi
    ip_address VARCHAR(45),                           -- IP address untuk tracking
    user_agent TEXT,                                  -- User agent untuk tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Waktu pembuatan
    approved_at TIMESTAMP NULL,                       -- Waktu approval
    approved_by INT NULL,                             -- ID admin yang approve
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Contoh data testimoni awal (approved)
INSERT INTO testimoni (nama, rating, caption, status, approved_at) VALUES
('Have Tomven', 5, 'Sangat membantu perkembangan motorik anak saya. Terapisnya profesional dan sabar dalam menangani anak.', 'approved', NOW()),
('Arna Wati', 5, 'Terapisnya handal dan komunikatif, kebersihan terjaga, adminnya ramah.', 'approved', NOW()),
('Wahyu Titis Kholifah', 5, 'Pelayanannya memuaskan, terapis profesional. Recommended!', 'approved', NOW()),
('Ibu Sarah', 4, 'Fasilitas lengkap dan terapis berpengalaman. Anak saya menunjukkan kemajuan yang signifikan.', 'approved', NOW()),
('Pak Andi', 5, 'Layanan terbaik di Kendari untuk terapi anak. Sangat recommended untuk orang tua yang mencari solusi untuk anak berkebutuhan khusus.', 'approved', NOW());

-- ALTER TABLE untuk menambah kolom baru pada users dan anak
ALTER TABLE users ADD COLUMN alamat VARCHAR(255) NULL AFTER nama_lengkap;
ALTER TABLE users ADD COLUMN no_telp VARCHAR(30) NULL AFTER alamat;

ALTER TABLE anak ADD COLUMN jenis_kelamin ENUM('L','P') NULL AFTER tanggal_lahir;
ALTER TABLE anak ADD COLUMN paket_id INT NULL AFTER jenis_kelamin;

-- Tambahkan foreign key untuk paket_id jika ingin relasi ke paket_belajar
ALTER TABLE anak ADD CONSTRAINT fk_paket_id FOREIGN KEY (paket_id) REFERENCES paket_belajar(paket_id) ON DELETE SET NULL;

-- Ubah kolom sesi pada tabel jadwal menjadi ENUM agar hanya bisa memilih 'Pagi', 'Siang', atau 'Sore'
ALTER TABLE jadwal MODIFY COLUMN sesi ENUM('Pagi','Siang','Sore') NOT NULL;

-- Migration: Add therapist-related fields to users table
-- Date: 2025-10-07
-- This script adds the following columns if they do not already exist:
--   alamat (VARCHAR), no_telp (VARCHAR), tanggal_lahir (DATE), no_atepi (VARCHAR)
-- It also shows sample UPDATE statements to populate existing therapist accounts.

DROP PROCEDURE IF EXISTS add_user_columns;
DELIMITER $$
CREATE PROCEDURE add_user_columns()
BEGIN
  -- alamat
  IF NOT EXISTS(
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'alamat'
  ) THEN
    ALTER TABLE `users` ADD COLUMN `alamat` VARCHAR(255) NULL;
  END IF;

  -- no_telp
  IF NOT EXISTS(
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'no_telp'
  ) THEN
    ALTER TABLE `users` ADD COLUMN `no_telp` VARCHAR(50) NULL;
  END IF;

  -- tanggal_lahir
  IF NOT EXISTS(
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tanggal_lahir'
  ) THEN
    ALTER TABLE `users` ADD COLUMN `tanggal_lahir` DATE NULL;
  END IF;

  -- no_atepi
  IF NOT EXISTS(
    SELECT * FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'no_atepi'
  ) THEN
    ALTER TABLE `users` ADD COLUMN `no_atepi` VARCHAR(50) NULL;
  END IF;
END$$
DELIMITER ;

-- Call the procedure to perform conditional ALTERs
CALL add_user_columns();

-- Drop the procedure after running (keeps DB clean)
DROP PROCEDURE IF EXISTS add_user_columns;

-- OPTIONAL: populate sample data for example therapists (adjust usernames as needed)
-- Update T001 and T002 examples (only run if you want sample data)
UPDATE `users` SET
  `alamat` = 'Jl. Contoh No.1',
  `no_telp` = '081234567890',
  `tanggal_lahir` = '1990-03-12',
  `no_atepi` = 'ATEPI-0001'
WHERE `username` = 'T001';

UPDATE `users` SET
  `alamat` = 'Jl. Contoh No.2',
  `no_telp` = '081298765432',
  `tanggal_lahir` = '1992-07-22',
  `no_atepi` = 'ATEPI-0002'
WHERE `username` = 'T002';

-- Quick checks: display therapist accounts (run after migration)
-- SELECT user_id, username, nama_lengkap, email, alamat, no_telp, tanggal_lahir, no_atepi FROM users WHERE role = 'terapis';

-- Fallback: if your MySQL user doesn't have privileges to create procedures, run these simple ALTERs manually instead:
-- ALTER TABLE users ADD COLUMN alamat VARCHAR(255) NULL;
-- ALTER TABLE users ADD COLUMN no_telp VARCHAR(50) NULL;
-- ALTER TABLE users ADD COLUMN tanggal_lahir DATE NULL;
-- ALTER TABLE users ADD COLUMN no_atepi VARCHAR(50) NULL;