import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nim, password } = body;

    if (!nim || !password) {
      return NextResponse.json(
        { error: 'NIM/Username dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    // Panggil RPC verify_user_login yang aman di PostgreSQL
    const { data: result, error: rpcError } = await supabaseServer.rpc('verify_user_login', {
      p_nim: String(nim).trim(),
      p_password: String(password),
    });

    if (rpcError) {
      console.error('RPC verify_user_login error:', rpcError);
      return NextResponse.json(
        { error: 'Gagal memverifikasi login: ' + rpcError.message },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || 'NIM/Username atau Password salah.' },
        { status: 401 }
      );
    }

    const safeUser = result.user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    // Pasang cookie sesi untuk proteksi middleware server-side
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('mutabaah_session', safeUser.nim, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
    });

    response.cookies.set('mutabaah_role', safeUser.role || 'anggota', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan sistem saat login.' },
      { status: 500 }
    );
  }
}
