-- Migration: business schema — semua tabel bisnis
-- Tables: 21 tabel data + RLS policies
-- Referensi: PRD §13 Data Model, .claude/database.md

-- ============================================================================
-- 1. MASTER DATA
-- ============================================================================

-- 1a. Struktur Organisasi (parent-child, gantikan unit_kerja datar)
CREATE TABLE public.struktur_organisasi (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES public.struktur_organisasi(id),
  nama TEXT NOT NULL,
  jenis_level TEXT NOT NULL,     -- Direktorat, Bidang, Bagian, Instalasi, Unit, Subbagian, dll
  kode TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. Unit Kerja (legacy — read-only, dimigrasikan ke struktur_organisasi)
CREATE TABLE public.unit_kerja (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1c. Golongan / Pangkat
CREATE TABLE public.golongan (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  pangkat TEXT,
  kategori TEXT,                -- Juru, Pengatur, Penata, Pembina, dll
  level INTEGER,                -- 1A=1, 1B=2, dst
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1d. Status Kepegawaian
CREATE TABLE public.status_pegawai (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,    -- PNS, PPPK, Honorer, Kontrak
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. Jabatan Fungsional
CREATE TABLE public.jabatan_fungsional (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  level INTEGER,
  jenis TEXT,                   -- Ahli, Terampil
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1f. Jabatan Struktural RS
CREATE TABLE public.jabatan_rs (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1g. Kategori Tenaga
CREATE TABLE public.master_kategori_tenaga (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,    -- Medis, Non-Medis, Penunjang
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1h. Jenis Tenaga (FK ke kategori)
CREATE TABLE public.master_jenis_tenaga (
  id SERIAL PRIMARY KEY,
  kategori_tenaga_id INTEGER NOT NULL REFERENCES public.master_kategori_tenaga(id),
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1i. Tingkat Pendidikan
CREATE TABLE public.master_tingkat_pendidikan (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,    -- SD, SMP, SMA, D3, S1, S2, S3
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1j. Universitas
CREATE TABLE public.master_universitas (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1k. Jurusan
CREATE TABLE public.master_jurusan (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. PEGAWAI (data utama)
-- ============================================================================
CREATE TABLE public.pegawai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identitas
  nik VARCHAR(16) UNIQUE,
  nip VARCHAR(18) UNIQUE,
  nama_lengkap TEXT NOT NULL,
  email TEXT,
  no_kk VARCHAR(16),
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(10),    -- Laki-laki, Perempuan
  agama TEXT,
  status_pernikahan TEXT,       -- Menikah, Belum Menikah, Duda/Janda
  alamat TEXT,
  telepon TEXT,

  -- Kepegawaian
  status_kepegawaian_id INTEGER REFERENCES public.status_pegawai(id),
  struktur_organisasi_id INTEGER REFERENCES public.struktur_organisasi(id),
  jabatan_fungsional_id INTEGER REFERENCES public.jabatan_fungsional(id),
  jenis_tenaga_id INTEGER REFERENCES public.master_jenis_tenaga(id),
  eselon TEXT,

  -- Karier
  golongan_id INTEGER REFERENCES public.golongan(id),
  golongan_cpns_id INTEGER REFERENCES public.golongan(id),
  tmt_pangkat DATE,
  tmt_jabatan DATE,
  tmt_cpns DATE,
  tmt_awal DATE,
  tmt_akhir DATE,

  -- KGB
  tmt_kgb DATE,
  tmt_kgb_seharusnya DATE,

  -- STR/SIP
  is_tenaga_medis BOOLEAN NOT NULL DEFAULT false,
  wajib_str BOOLEAN NOT NULL DEFAULT false,
  wajib_sip BOOLEAN NOT NULL DEFAULT false,

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,

  -- Audit internal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. RIWAYAT & RELASI
-- ============================================================================

-- 3a. Riwayat Pendidikan
CREATE TABLE public.riwayat_pendidikan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  tingkat_pendidikan_id INTEGER REFERENCES public.master_tingkat_pendidikan(id),
  tingkat_text TEXT,            -- Fallback teks bebas
  nama_universitas TEXT,        -- Bisa denormalisasi
  universitas_id INTEGER REFERENCES public.master_universitas(id),
  nama_jurusan TEXT,            -- Bisa denormalisasi
  jurusan_id INTEGER REFERENCES public.master_jurusan(id),
  tahun_lulus INTEGER,
  nomor_ijazah TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3b. Riwayat Jabatan RS (mutasi, promosi, demosi)
CREATE TABLE public.pegawai_jabatan_rs (
  id SERIAL PRIMARY KEY,
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  jabatan_rs_id INTEGER NOT NULL REFERENCES public.jabatan_rs(id),
  tmt_jabatan DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3c. Sertifikat / STR / SIP / Diklat
CREATE TABLE public.pegawai_sertifikat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  nama_kegiat_an TEXT,          -- Legacy column name
  jenis_sertifikat TEXT,        -- STR, SIP, Sertifikat, Diklat
  tmt_kegiat_an DATE,           -- Legacy column name
  jumlah_jam INTEGER,
  penyedia TEXT,
  lokasi TEXT,
  berlaku_hingga DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3d. Riwayat Sertifikat (legacy)
CREATE TABLE public.riwayat_sertifikat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  nama_kegiat_an TEXT,
  tmt_kegiat_an DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3e. Dokumen Digital Pegawai (metadata; file di Supabase Storage)
CREATE TABLE public.dokumen_pegawai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  pengajuan_verifikasi_id INTEGER,  -- FK diisi setelah tabel pengajuan dibuat

  kategori_dokumen TEXT NOT NULL,   -- Identitas, Pendidikan, Kepegawaian, Kepangkatan, KGB, Profesi, Kontrak, Pengajuan, Lainnya
  nama_dokumen TEXT NOT NULL,
  nomor_dokumen TEXT,
  tanggal_dokumen DATE,
  tanggal_berakhir DATE,            -- Untuk dokumen dengan masa berlaku

  -- Storage
  file_url TEXT NOT NULL,           -- Path relatif di Supabase Storage
  file_name TEXT NOT NULL,          -- Nama file asli
  file_size BIGINT,
  mime_type TEXT,

  uploaded_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. RIWAYAT KENAIKAN (KGB & Kenaikan Pangkat)
-- ============================================================================
CREATE TABLE public.riwayat_kenaikan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  jenis_kenaikan VARCHAR(20) NOT NULL,   -- 'kgb' atau 'pangkat'
  golongan_lama_id INTEGER REFERENCES public.golongan(id),
  golongan_baru_id INTEGER REFERENCES public.golongan(id),
  tmt_seharusnya DATE,
  tmt_kenaikan DATE,
  is_retroaktif BOOLEAN NOT NULL DEFAULT false,
  is_override BOOLEAN NOT NULL DEFAULT false,
  alasan_override TEXT,
  dokumen_pendukung_id UUID REFERENCES public.dokumen_pegawai(id),
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. PENGAJUAN & VERIFIKASI
-- ============================================================================
CREATE TABLE public.pengajuan_verifikasi (
  id SERIAL PRIMARY KEY,
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  jenis_perubahan TEXT NOT NULL,
  data_lama JSONB NOT NULL DEFAULT '{}',
  data_baru JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, diterima, ditolak
  catatan TEXT,
  diajukan_oleh UUID NOT NULL REFERENCES auth.users(id),
  diverifikasi_oleh UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK dokumen_pegawai.pengajuan_verifikasi_id setelah tabel pengajuan dibuat
ALTER TABLE public.dokumen_pegawai
  ADD CONSTRAINT fk_dokumen_pengajuan
  FOREIGN KEY (pengajuan_verifikasi_id)
  REFERENCES public.pengajuan_verifikasi(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. AUDIT & LOG
-- ============================================================================

-- 6a. Audit Log Pegawai
CREATE TABLE public.pegawai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id UUID NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,     -- INSERT, UPDATE, DELETE (soft delete), RESTORE
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6b. User Management Log
CREATE TABLE public.user_management_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES auth.users(id),
  aksi TEXT NOT NULL,            -- create_user, reset_password, change_role, delete_user
  dilakukan_oleh UUID REFERENCES auth.users(id),
  nilai_lama JSONB,
  nilai_baru JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. TEMPLATE LAPORAN
-- ============================================================================
CREATE TABLE public.template_laporan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jenis_laporan TEXT NOT NULL,   -- duk, jenis_tenaga, pensiun, pangkat, kgb, kontrak, bezzeting, komposisi, custom
  konfigurasi JSONB NOT NULL DEFAULT '{}',  -- kolom, filter, sorting, format export
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. INDEXES
-- ============================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role_id);
CREATE INDEX idx_pegawai_nama ON public.pegawai(nama_lengkap);
CREATE INDEX idx_pegawai_nik ON public.pegawai(nik);
CREATE INDEX idx_pegawai_nip ON public.pegawai(nip);
CREATE INDEX idx_pegawai_status ON public.pegawai(status_kepegawaian_id);
CREATE INDEX idx_pegawai_unit ON public.pegawai(struktur_organisasi_id);
CREATE INDEX idx_pegawai_is_deleted ON public.pegawai(is_deleted);
CREATE INDEX idx_pegawai_user_id ON public.pegawai(user_id);
CREATE INDEX idx_pegawai_deleted_at ON public.pegawai(deleted_at);

CREATE INDEX idx_struktur_organisasi_parent ON public.struktur_organisasi(parent_id);
CREATE INDEX idx_struktur_organisasi_aktif ON public.struktur_organisasi(is_active);

CREATE INDEX idx_riwayat_pendidikan_pegawai ON public.riwayat_pendidikan(pegawai_id);
CREATE INDEX idx_pegawai_jabatan_rs_pegawai ON public.pegawai_jabatan_rs(pegawai_id);
CREATE INDEX idx_pegawai_sertifikat_pegawai ON public.pegawai_sertifikat(pegawai_id);
CREATE INDEX idx_pegawai_sertifikat_berlaku ON public.pegawai_sertifikat(berlaku_hingga);
CREATE INDEX idx_riwayat_sertifikat_pegawai ON public.riwayat_sertifikat(pegawai_id);
CREATE INDEX idx_dokumen_pegawai_pegawai ON public.dokumen_pegawai(pegawai_id);
CREATE INDEX idx_dokumen_pegawai_pengajuan ON public.dokumen_pegawai(pengajuan_verifikasi_id);
CREATE INDEX idx_dokumen_pegawai_kategori ON public.dokumen_pegawai(kategori_dokumen);
CREATE INDEX idx_dokumen_pegawai_aktif ON public.dokumen_pegawai(is_active);

CREATE INDEX idx_riwayat_kenaikan_pegawai ON public.riwayat_kenaikan(pegawai_id);
CREATE INDEX idx_riwayat_kenaikan_jenis ON public.riwayat_kenaikan(jenis_kenaikan);

CREATE INDEX idx_pengajuan_verifikasi_pegawai ON public.pengajuan_verifikasi(pegawai_id);
CREATE INDEX idx_pengajuan_verifikasi_status ON public.pengajuan_verifikasi(status);
CREATE INDEX idx_pengajuan_verifikasi_diajukan ON public.pengajuan_verifikasi(diajukan_oleh);

CREATE INDEX idx_pegawai_audit_log_pegawai ON public.pegawai_audit_log(pegawai_id);
CREATE INDEX idx_pegawai_audit_log_created ON public.pegawai_audit_log(created_at DESC);

CREATE INDEX idx_template_laporan_jenis ON public.template_laporan(jenis_laporan);
CREATE INDEX idx_template_laporan_default ON public.template_laporan(is_default);

CREATE INDEX idx_master_jenis_tenaga_kategori ON public.master_jenis_tenaga(kategori_tenaga_id);

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 9a. Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply ke semua tabel dengan updated_at
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_struktur_organisasi BEFORE UPDATE ON public.struktur_organisasi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_golongan BEFORE UPDATE ON public.golongan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_jabatan_fungsional BEFORE UPDATE ON public.jabatan_fungsional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_jabatan_rs BEFORE UPDATE ON public.jabatan_rs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_pegawai BEFORE UPDATE ON public.pegawai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_riwayat_pendidikan BEFORE UPDATE ON public.riwayat_pendidikan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_pegawai_sertifikat BEFORE UPDATE ON public.pegawai_sertifikat
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_dokumen_pegawai BEFORE UPDATE ON public.dokumen_pegawai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_riwayat_kenaikan BEFORE UPDATE ON public.riwayat_kenaikan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_pengajuan_verifikasi BEFORE UPDATE ON public.pengajuan_verifikasi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_template_laporan BEFORE UPDATE ON public.template_laporan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9b. Audit log trigger untuk perubahan pegawai
CREATE OR REPLACE FUNCTION public.log_pegawai_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_name TEXT;
BEGIN
  -- Ambil nama user dari profiles
  SELECT nama_lengkap INTO current_user_name FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    -- Soft delete
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      INSERT INTO public.pegawai_audit_log (pegawai_id, change_type, field_name, old_value, new_value, changed_by, changed_by_name)
      VALUES (NEW.id, 'DELETE', 'is_deleted', 'false', 'true', auth.uid(), current_user_name);
    END IF;

    -- Restore
    IF NEW.is_deleted = false AND OLD.is_deleted = true THEN
      INSERT INTO public.pegawai_audit_log (pegawai_id, change_type, field_name, old_value, new_value, changed_by, changed_by_name)
      VALUES (NEW.id, 'RESTORE', 'is_deleted', 'true', 'false', auth.uid(), current_user_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_pegawai_changes
  AFTER UPDATE ON public.pegawai
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pegawai_changes();

-- 9c. Sinkronisasi user_id pegawai saat profile dibuat
CREATE OR REPLACE FUNCTION public.link_pegawai_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Jika pegawai dibuat dengan email yang cocok dengan auth.users,
  -- auto-link user_id jika belum di-set
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    UPDATE public.pegawai
    SET user_id = (
      SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1
    )
    WHERE id = NEW.id AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER link_pegawai_user_after_insert
  AFTER INSERT ON public.pegawai
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pegawai_to_user();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Helper: admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role_id IN (1, 2)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role_id = 1
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pegawai_pemilik(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT check_user_id = auth.uid();
$$;

-- --- struktur_organisasi ---
ALTER TABLE public.struktur_organisasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_struktur_organisasi" ON public.struktur_organisasi
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_struktur_organisasi" ON public.struktur_organisasi
  FOR SELECT TO authenticated
  USING (true);

-- --- unit_kerja (legacy, read-only) ---
ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_unit_kerja" ON public.unit_kerja
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_unit_kerja" ON public.unit_kerja
  FOR SELECT TO authenticated
  USING (true);

-- --- golongan ---
ALTER TABLE public.golongan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_golongan" ON public.golongan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_golongan" ON public.golongan
  FOR SELECT TO authenticated
  USING (true);

-- --- status_pegawai ---
ALTER TABLE public.status_pegawai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_status_pegawai" ON public.status_pegawai
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_status_pegawai" ON public.status_pegawai
  FOR SELECT TO authenticated
  USING (true);

-- --- jabatan_fungsional ---
ALTER TABLE public.jabatan_fungsional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_jabatan_fungsional" ON public.jabatan_fungsional
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_jabatan_fungsional" ON public.jabatan_fungsional
  FOR SELECT TO authenticated
  USING (true);

-- --- jabatan_rs ---
ALTER TABLE public.jabatan_rs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_jabatan_rs" ON public.jabatan_rs
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_jabatan_rs" ON public.jabatan_rs
  FOR SELECT TO authenticated
  USING (true);

-- --- master_kategori_tenaga ---
ALTER TABLE public.master_kategori_tenaga ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_kategori_tenaga" ON public.master_kategori_tenaga
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_kategori_tenaga" ON public.master_kategori_tenaga
  FOR SELECT TO authenticated
  USING (true);

-- --- master_jenis_tenaga ---
ALTER TABLE public.master_jenis_tenaga ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_jenis_tenaga" ON public.master_jenis_tenaga
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_jenis_tenaga" ON public.master_jenis_tenaga
  FOR SELECT TO authenticated
  USING (true);

-- --- master_tingkat_pendidikan ---
ALTER TABLE public.master_tingkat_pendidikan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_tingkat_pendidikan" ON public.master_tingkat_pendidikan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_tingkat_pendidikan" ON public.master_tingkat_pendidikan
  FOR SELECT TO authenticated
  USING (true);

-- --- master_universitas ---
ALTER TABLE public.master_universitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_universitas" ON public.master_universitas
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_universitas" ON public.master_universitas
  FOR SELECT TO authenticated
  USING (true);

-- --- master_jurusan ---
ALTER TABLE public.master_jurusan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_jurusan" ON public.master_jurusan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_jurusan" ON public.master_jurusan
  FOR SELECT TO authenticated
  USING (true);

-- --- pegawai ---
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_semua_pegawai" ON public.pegawai
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_data_sendiri" ON public.pegawai
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- --- riwayat_pendidikan ---
ALTER TABLE public.riwayat_pendidikan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_riwayat_pendidikan" ON public.riwayat_pendidikan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_riwayat_sendiri" ON public.riwayat_pendidikan
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = riwayat_pendidikan.pegawai_id AND user_id = auth.uid())
  );

-- --- pegawai_jabatan_rs ---
ALTER TABLE public.pegawai_jabatan_rs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_jabatan_pegawai" ON public.pegawai_jabatan_rs
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_jabatan_sendiri" ON public.pegawai_jabatan_rs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = pegawai_jabatan_rs.pegawai_id AND user_id = auth.uid())
  );

-- --- pegawai_sertifikat ---
ALTER TABLE public.pegawai_sertifikat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_sertifikat" ON public.pegawai_sertifikat
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_sertifikat_sendiri" ON public.pegawai_sertifikat
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = pegawai_sertifikat.pegawai_id AND user_id = auth.uid())
  );

-- --- riwayat_sertifikat (legacy) ---
ALTER TABLE public.riwayat_sertifikat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_riwayat_sertifikat" ON public.riwayat_sertifikat
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_riwayat_sertifikat_sendiri" ON public.riwayat_sertifikat
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = riwayat_sertifikat.pegawai_id AND user_id = auth.uid())
  );

-- --- dokumen_pegawai ---
ALTER TABLE public.dokumen_pegawai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_dokumen" ON public.dokumen_pegawai
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_dokumen_sendiri" ON public.dokumen_pegawai
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = dokumen_pegawai.pegawai_id AND user_id = auth.uid())
  );

-- Pegawai bisa upload dokumen untuk pengajuan
CREATE POLICY "pegawai_insert_dokumen_pengajuan" ON public.dokumen_pegawai
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = dokumen_pegawai.pegawai_id AND user_id = auth.uid())
  );

-- --- riwayat_kenaikan ---
ALTER TABLE public.riwayat_kenaikan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_riwayat_kenaikan" ON public.riwayat_kenaikan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_lihat_kenaikan_sendiri" ON public.riwayat_kenaikan
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = riwayat_kenaikan.pegawai_id AND user_id = auth.uid())
  );

-- --- pengajuan_verifikasi ---
ALTER TABLE public.pengajuan_verifikasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_lihat_semua_pengajuan" ON public.pengajuan_verifikasi
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_approve_reject_pengajuan" ON public.pengajuan_verifikasi
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "pegawai_kelola_pengajuan_sendiri" ON public.pengajuan_verifikasi
  FOR ALL TO authenticated
  USING (diajukan_oleh = auth.uid());

-- --- pegawai_audit_log ---
ALTER TABLE public.pegawai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_lihat_audit_log" ON public.pegawai_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "super_admin_delete_audit_log" ON public.pegawai_audit_log
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "pegawai_lihat_audit_sendiri" ON public.pegawai_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pegawai WHERE id = pegawai_audit_log.pegawai_id AND user_id = auth.uid())
  );

-- --- user_management_log ---
ALTER TABLE public.user_management_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_lihat_user_log" ON public.user_management_log
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_kelola_user_log" ON public.user_management_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

-- --- template_laporan ---
ALTER TABLE public.template_laporan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_kelola_template" ON public.template_laporan
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "semua_lihat_template_default" ON public.template_laporan
  FOR SELECT TO authenticated
  USING (is_default = true);
