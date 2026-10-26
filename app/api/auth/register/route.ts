import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nim, nama, password, roleToRegister, kodeKelompok, noHp } = body;

    const trimmedNim = String(nim || '').trim();
    const trimmedNama = String(nama || '').trim();
    const trimmedPassword = String(password || '');

    // 1. Validasi input dasar
    if (!trimmedNim) {
      return NextResponse.json(
        { error: 'NIM / Username wajib diisi.' },
        { status: 400 }
      );
    }

    if (!trimmedNama) {
      return NextResponse.json(
        { error: 'Nama lengkap wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. Penegakan aturan password minimal 6 karakter
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password terlalu pendek. Minimal 6 karakter demi keamanan akunmu.' },
        { status: 400 }
      );
    }

    // 3. Cek apakah NIM/Username sudah terdaftar
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('nim')
      .eq('nim', trimmedNim)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'NIM / Username ini sudah terdaftar! Silakan langsung login.' },
        { status: 400 }
      );
    }

    // 4. Validasi kode kelompok jika diisi
    let assignedGroupId: string | null = null;
    const cleanKode = String(kodeKelompok || '').trim();

    if (roleToRegister === 'anggota' && cleanKode) {
      const { data: groupData, error: groupErr } = await supabaseServer
        .from('groups')
        .select('id, nama_kelompok')
        .ilike('kode_kelompok', cleanKode)
        .maybeSingle();

      if (groupErr || !groupData) {
        return NextResponse.json(
          { error: `Kode kelompok "${cleanKode}" tidak ditemukan. Silakan kosongkan jika belum punya kode.` },
          { status: 400 }
        );
      }

      assignedGroupId = groupData.id;
    }

    // 5. Hash password menggunakan bcrypt (cost = 10)
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    const initialStatus = roleToRegister === 'musyrif' ? 'pending' : 'approved';
    const targetRole = roleToRegister === 'musyrif' ? 'musyrif' : 'anggota';

    // 6. Simpan user baru ke database
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users')
      .insert([
        {
          nim: trimmedNim,
          nama: trimmedNama,
          password: hashedPassword, // Hash tersimpan aman di database
          role: targetRole,
          status: initialStatus,
          group_id: assignedGroupId,
          no_hp: String(noHp || '').trim() || null,
        },
      ])
      .select()
      .single();

    if (insertError || !newUser) {
      return NextResponse.json(
        { error: 'Gagal mendaftar: ' + (insertError?.message || 'Database error') },
        { status: 500 }
      );
    }

    // Hapus hash password dari response
    const { password: _, ...safeUser } = newUser;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      role: targetRole,
    });

    // Jika anggota langsung approved, pasang session cookies
    if (initialStatus === 'approved') {
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookies.set('mutabaah_session', safeUser.nim, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      response.cookies.set('mutabaah_role', targetRole, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan sistem saat mendaftar.' },
      { status: 500 }
    );
  }
}
