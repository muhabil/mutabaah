import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    // Ambil user dari database
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('nim', String(nim).trim())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'NIM/Username atau Password salah, atau belum terdaftar.' },
        { status: 401 }
      );
    }

    // Cek password menggunakan bcrypt (dengan fallback lazy migration jika password lama masih plaintext)
    const storedPass = String(user.password || '');
    const isBcrypt = storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$');
    let isMatch = false;

    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, storedPass);
    } else {
      // Lazy migration: jika password lama sama persis dengan plaintext
      if (storedPass === password) {
        isMatch = true;
        // Langsung upgrade ke bcrypt hash di database
        try {
          const newHashed = await bcrypt.hash(password, 10);
          await supabaseServer
            .from('users')
            .update({ password: newHashed })
            .eq('nim', user.nim);
        } catch (upgradeErr) {
          console.error('Gagal upgrade hash password:', upgradeErr);
        }
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'NIM/Username atau Password salah.' },
        { status: 401 }
      );
    }

    // Cek status persetujuan akun
    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Akun kamu masih berstatus PENDING. Silakan hubungi Admin Kaderisasi untuk aktivasi.' },
        { status: 403 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: 'Mohon maaf, pendaftaran akun kamu belum disetujui oleh Admin.' },
        { status: 403 }
      );
    }

    // Hapus hash password dari response untuk keamanan
    const { password: _, ...safeUser } = user;

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
