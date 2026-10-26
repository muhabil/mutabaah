import { NextRequest, NextResponse } from 'next/server';
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

    const targetRole = roleToRegister === 'musyrif' ? 'musyrif' : 'anggota';

    // 3. Panggil RPC register_user_secure di PostgreSQL
    const { data: result, error: rpcError } = await supabaseServer.rpc('register_user_secure', {
      p_nim: trimmedNim,
      p_nama: trimmedNama,
      p_password: trimmedPassword,
      p_role: targetRole,
      p_no_hp: String(noHp || '').trim() || null,
      p_kode_kelompok: String(kodeKelompok || '').trim() || null,
    });

    if (rpcError) {
      console.error('RPC register_user_secure error:', rpcError);
      return NextResponse.json(
        { error: 'Gagal mendaftar: ' + rpcError.message },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || 'Pendaftaran gagal.' },
        { status: 400 }
      );
    }

    const safeUser = result.user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      role: targetRole,
    });

    // Jika anggota langsung approved, pasang session cookies
    if (safeUser.status === 'approved') {
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
