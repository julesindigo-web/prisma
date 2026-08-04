'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Email atau kata sandi salah.');
      return;
    }
    router.push('/home');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="prisma-monogram mb-1 text-3xl font-bold tracking-widest">PA</div>
          <h1 className="text-2xl font-semibold text-porcelain">PRISMA</h1>
          <p className="mt-1 text-sm text-porcelain/60">Keselamatan, terlihat menyeluruh.</p>
        </div>

        <form onSubmit={handleSubmit} className="prisma-card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">Kata sandi</label>
            <input
              id="password"
              type="password"
              required
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-porcelain/40">
          dikonsep &amp; dirancang oleh <span className="prisma-signature">Priastama Adiyoga</span>
        </p>
      </div>
    </main>
  );
}
