export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dokumen_pegawai: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean
          kategori_dokumen: string
          mime_type: string | null
          nama_dokumen: string
          nomor_dokumen: string | null
          pegawai_id: string
          pengajuan_verifikasi_id: number | null
          tanggal_berakhir: string | null
          tanggal_dokumen: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean
          kategori_dokumen: string
          mime_type?: string | null
          nama_dokumen: string
          nomor_dokumen?: string | null
          pegawai_id: string
          pengajuan_verifikasi_id?: number | null
          tanggal_berakhir?: string | null
          tanggal_dokumen?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean
          kategori_dokumen?: string
          mime_type?: string | null
          nama_dokumen?: string
          nomor_dokumen?: string | null
          pegawai_id?: string
          pengajuan_verifikasi_id?: number | null
          tanggal_berakhir?: string | null
          tanggal_dokumen?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_pegawai_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dokumen_pengajuan"
            columns: ["pengajuan_verifikasi_id"]
            isOneToOne: false
            referencedRelation: "pengajuan_verifikasi"
            referencedColumns: ["id"]
          },
        ]
      }
      golongan: {
        Row: {
          created_at: string
          id: number
          kategori: string | null
          level: number | null
          nama: string
          pangkat: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          kategori?: string | null
          level?: number | null
          nama: string
          pangkat?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          kategori?: string | null
          level?: number | null
          nama?: string
          pangkat?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jabatan_fungsional: {
        Row: {
          created_at: string
          id: number
          jenis: string | null
          level: number | null
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          jenis?: string | null
          level?: number | null
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          jenis?: string | null
          level?: number | null
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      jabatan_rs: {
        Row: {
          created_at: string
          id: number
          level: number | null
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          level?: number | null
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          level?: number | null
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_jenis_tenaga: {
        Row: {
          created_at: string
          id: number
          kategori_tenaga_id: number
          nama: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: number
          kategori_tenaga_id: number
          nama: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: number
          kategori_tenaga_id?: number
          nama?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_jenis_tenaga_kategori_tenaga_id_fkey"
            columns: ["kategori_tenaga_id"]
            isOneToOne: false
            referencedRelation: "master_kategori_tenaga"
            referencedColumns: ["id"]
          },
        ]
      }
      master_jurusan: {
        Row: {
          created_at: string
          id: number
          nama: string
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
        }
        Relationships: []
      }
      master_kategori_tenaga: {
        Row: {
          created_at: string
          id: number
          nama: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      master_tingkat_pendidikan: {
        Row: {
          created_at: string
          id: number
          nama: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      master_universitas: {
        Row: {
          created_at: string
          id: number
          nama: string
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
        }
        Relationships: []
      }
      pegawai: {
        Row: {
          agama: string | null
          alamat: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          eselon: string | null
          golongan_cpns_id: number | null
          golongan_id: number | null
          id: string
          is_deleted: boolean
          is_tenaga_medis: boolean
          jabatan_fungsional_id: number | null
          jenis_kelamin: string | null
          jenis_tenaga_id: number | null
          nama_lengkap: string
          nik: string | null
          nip: string | null
          no_kk: string | null
          status_kepegawaian_id: number | null
          status_pernikahan: string | null
          struktur_organisasi_id: number | null
          tanggal_lahir: string | null
          telepon: string | null
          tempat_lahir: string | null
          tmt_akhir: string | null
          tmt_awal: string | null
          tmt_cpns: string | null
          tmt_jabatan: string | null
          tmt_kgb: string | null
          tmt_kgb_seharusnya: string | null
          tmt_pangkat: string | null
          updated_at: string
          user_id: string | null
          wajib_sip: boolean
          wajib_str: boolean
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          eselon?: string | null
          golongan_cpns_id?: number | null
          golongan_id?: number | null
          id?: string
          is_deleted?: boolean
          is_tenaga_medis?: boolean
          jabatan_fungsional_id?: number | null
          jenis_kelamin?: string | null
          jenis_tenaga_id?: number | null
          nama_lengkap: string
          nik?: string | null
          nip?: string | null
          no_kk?: string | null
          status_kepegawaian_id?: number | null
          status_pernikahan?: string | null
          struktur_organisasi_id?: number | null
          tanggal_lahir?: string | null
          telepon?: string | null
          tempat_lahir?: string | null
          tmt_akhir?: string | null
          tmt_awal?: string | null
          tmt_cpns?: string | null
          tmt_jabatan?: string | null
          tmt_kgb?: string | null
          tmt_kgb_seharusnya?: string | null
          tmt_pangkat?: string | null
          updated_at?: string
          user_id?: string | null
          wajib_sip?: boolean
          wajib_str?: boolean
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          eselon?: string | null
          golongan_cpns_id?: number | null
          golongan_id?: number | null
          id?: string
          is_deleted?: boolean
          is_tenaga_medis?: boolean
          jabatan_fungsional_id?: number | null
          jenis_kelamin?: string | null
          jenis_tenaga_id?: number | null
          nama_lengkap?: string
          nik?: string | null
          nip?: string | null
          no_kk?: string | null
          status_kepegawaian_id?: number | null
          status_pernikahan?: string | null
          struktur_organisasi_id?: number | null
          tanggal_lahir?: string | null
          telepon?: string | null
          tempat_lahir?: string | null
          tmt_akhir?: string | null
          tmt_awal?: string | null
          tmt_cpns?: string | null
          tmt_jabatan?: string | null
          tmt_kgb?: string | null
          tmt_kgb_seharusnya?: string | null
          tmt_pangkat?: string | null
          updated_at?: string
          user_id?: string | null
          wajib_sip?: boolean
          wajib_str?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pegawai_golongan_cpns_id_fkey"
            columns: ["golongan_cpns_id"]
            isOneToOne: false
            referencedRelation: "golongan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_golongan_id_fkey"
            columns: ["golongan_id"]
            isOneToOne: false
            referencedRelation: "golongan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_jabatan_fungsional_id_fkey"
            columns: ["jabatan_fungsional_id"]
            isOneToOne: false
            referencedRelation: "jabatan_fungsional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_jenis_tenaga_id_fkey"
            columns: ["jenis_tenaga_id"]
            isOneToOne: false
            referencedRelation: "master_jenis_tenaga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_status_kepegawaian_id_fkey"
            columns: ["status_kepegawaian_id"]
            isOneToOne: false
            referencedRelation: "status_pegawai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_struktur_organisasi_id_fkey"
            columns: ["struktur_organisasi_id"]
            isOneToOne: false
            referencedRelation: "struktur_organisasi"
            referencedColumns: ["id"]
          },
        ]
      }
      pegawai_audit_log: {
        Row: {
          change_type: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          pegawai_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          pegawai_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          pegawai_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pegawai_audit_log_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      pegawai_jabatan_rs: {
        Row: {
          created_at: string
          id: number
          jabatan_rs_id: number
          keterangan: string | null
          pegawai_id: string
          tmt_jabatan: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          jabatan_rs_id: number
          keterangan?: string | null
          pegawai_id: string
          tmt_jabatan?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          jabatan_rs_id?: number
          keterangan?: string | null
          pegawai_id?: string
          tmt_jabatan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pegawai_jabatan_rs_jabatan_rs_id_fkey"
            columns: ["jabatan_rs_id"]
            isOneToOne: false
            referencedRelation: "jabatan_rs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pegawai_jabatan_rs_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      pegawai_sertifikat: {
        Row: {
          berlaku_hingga: string | null
          created_at: string
          id: string
          jenis_sertifikat: string | null
          jumlah_jam: number | null
          lokasi: string | null
          nama_kegiat_an: string | null
          pegawai_id: string
          penyedia: string | null
          tmt_kegiat_an: string | null
          updated_at: string
        }
        Insert: {
          berlaku_hingga?: string | null
          created_at?: string
          id?: string
          jenis_sertifikat?: string | null
          jumlah_jam?: number | null
          lokasi?: string | null
          nama_kegiat_an?: string | null
          pegawai_id: string
          penyedia?: string | null
          tmt_kegiat_an?: string | null
          updated_at?: string
        }
        Update: {
          berlaku_hingga?: string | null
          created_at?: string
          id?: string
          jenis_sertifikat?: string | null
          jumlah_jam?: number | null
          lokasi?: string | null
          nama_kegiat_an?: string | null
          pegawai_id?: string
          penyedia?: string | null
          tmt_kegiat_an?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pegawai_sertifikat_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuan_verifikasi: {
        Row: {
          catatan: string | null
          created_at: string
          data_baru: Json
          data_lama: Json
          diajukan_oleh: string
          diverifikasi_oleh: string | null
          id: number
          jenis_perubahan: string
          pegawai_id: string
          status: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          data_baru?: Json
          data_lama?: Json
          diajukan_oleh: string
          diverifikasi_oleh?: string | null
          id?: number
          jenis_perubahan: string
          pegawai_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          data_baru?: Json
          data_lama?: Json
          diajukan_oleh?: string
          diverifikasi_oleh?: string | null
          id?: number
          jenis_perubahan?: string
          pegawai_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_verifikasi_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nama_lengkap: string
          role_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nama_lengkap?: string
          role_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_lengkap?: string
          role_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      riwayat_kenaikan: {
        Row: {
          alasan_override: string | null
          created_at: string
          dokumen_pendukung_id: string | null
          golongan_baru_id: number | null
          golongan_lama_id: number | null
          id: string
          is_override: boolean
          is_retroaktif: boolean
          jenis_kenaikan: string
          keterangan: string | null
          pegawai_id: string
          tmt_kenaikan: string | null
          tmt_seharusnya: string | null
          updated_at: string
        }
        Insert: {
          alasan_override?: string | null
          created_at?: string
          dokumen_pendukung_id?: string | null
          golongan_baru_id?: number | null
          golongan_lama_id?: number | null
          id?: string
          is_override?: boolean
          is_retroaktif?: boolean
          jenis_kenaikan: string
          keterangan?: string | null
          pegawai_id: string
          tmt_kenaikan?: string | null
          tmt_seharusnya?: string | null
          updated_at?: string
        }
        Update: {
          alasan_override?: string | null
          created_at?: string
          dokumen_pendukung_id?: string | null
          golongan_baru_id?: number | null
          golongan_lama_id?: number | null
          id?: string
          is_override?: boolean
          is_retroaktif?: boolean
          jenis_kenaikan?: string
          keterangan?: string | null
          pegawai_id?: string
          tmt_kenaikan?: string | null
          tmt_seharusnya?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_kenaikan_dokumen_pendukung_id_fkey"
            columns: ["dokumen_pendukung_id"]
            isOneToOne: false
            referencedRelation: "dokumen_pegawai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_kenaikan_golongan_baru_id_fkey"
            columns: ["golongan_baru_id"]
            isOneToOne: false
            referencedRelation: "golongan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_kenaikan_golongan_lama_id_fkey"
            columns: ["golongan_lama_id"]
            isOneToOne: false
            referencedRelation: "golongan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_kenaikan_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      riwayat_pendidikan: {
        Row: {
          created_at: string
          id: string
          jurusan_id: number | null
          nama_jurusan: string | null
          nama_universitas: string | null
          nomor_ijazah: string | null
          pegawai_id: string
          tahun_lulus: number | null
          tingkat_pendidikan_id: number | null
          tingkat_text: string | null
          universitas_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan_id?: number | null
          nama_jurusan?: string | null
          nama_universitas?: string | null
          nomor_ijazah?: string | null
          pegawai_id: string
          tahun_lulus?: number | null
          tingkat_pendidikan_id?: number | null
          tingkat_text?: string | null
          universitas_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jurusan_id?: number | null
          nama_jurusan?: string | null
          nama_universitas?: string | null
          nomor_ijazah?: string | null
          pegawai_id?: string
          tahun_lulus?: number | null
          tingkat_pendidikan_id?: number | null
          tingkat_text?: string | null
          universitas_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_pendidikan_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "master_jurusan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_pendidikan_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_pendidikan_tingkat_pendidikan_id_fkey"
            columns: ["tingkat_pendidikan_id"]
            isOneToOne: false
            referencedRelation: "master_tingkat_pendidikan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_pendidikan_universitas_id_fkey"
            columns: ["universitas_id"]
            isOneToOne: false
            referencedRelation: "master_universitas"
            referencedColumns: ["id"]
          },
        ]
      }
      riwayat_sertifikat: {
        Row: {
          created_at: string
          id: string
          nama_kegiat_an: string | null
          pegawai_id: string
          tmt_kegiat_an: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kegiat_an?: string | null
          pegawai_id: string
          tmt_kegiat_an?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama_kegiat_an?: string | null
          pegawai_id?: string
          tmt_kegiat_an?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_sertifikat_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      status_pegawai: {
        Row: {
          created_at: string
          id: number
          nama: string
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
        }
        Relationships: []
      }
      struktur_organisasi: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          jenis_level: string
          kode: string | null
          nama: string
          parent_id: number | null
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          jenis_level: string
          kode?: string | null
          nama: string
          parent_id?: number | null
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          jenis_level?: string
          kode?: string | null
          nama?: string
          parent_id?: number | null
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "struktur_organisasi_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "struktur_organisasi"
            referencedColumns: ["id"]
          },
        ]
      }
      template_laporan: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          jenis_laporan: string
          konfigurasi: Json
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          jenis_laporan: string
          konfigurasi?: Json
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          jenis_laporan?: string
          konfigurasi?: Json
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_kerja: {
        Row: {
          created_at: string
          id: number
          nama: string
        }
        Insert: {
          created_at?: string
          id?: number
          nama: string
        }
        Update: {
          created_at?: string
          id?: number
          nama?: string
        }
        Relationships: []
      }
      user_management_log: {
        Row: {
          aksi: string
          created_at: string
          dilakukan_oleh: string | null
          id: string
          nilai_baru: Json | null
          nilai_lama: Json | null
          target_user_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          dilakukan_oleh?: string | null
          id?: string
          nilai_baru?: Json | null
          nilai_lama?: Json | null
          target_user_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          dilakukan_oleh?: string | null
          id?: string
          nilai_baru?: Json | null
          nilai_lama?: Json | null
          target_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_pegawai_pemilik: { Args: { check_user_id: string }; Returns: boolean }
      is_super_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
