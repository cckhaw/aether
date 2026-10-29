import { useState } from 'react';
import { LogOut, Mail, X } from 'lucide-react';
import { authClient } from '../lib/auth.js';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default function AuthSheet({ account, onClose }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    }
    setBusy(false);
  };

  const google = () =>
    run(async () => {
      const { error: err } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/`,
      });
      if (err) throw new Error(err.message || 'Google sign-in failed');
    });

  const sendCode = () =>
    run(async () => {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: 'sign-in',
      });
      if (err) throw new Error(err.message || 'Could not send the code');
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      const { error: err } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: code.trim(),
      });
      if (err) throw new Error(err.message || 'That code didn’t work');
      await account.refresh();
      onClose();
    });

  const input =
    'w-full rounded-2xl bg-white/10 px-4 py-3.5 text-[16px] outline-none placeholder:text-white/35 focus:ring-2 focus:ring-aether-blue';

  return (
    <div className="absolute inset-0 z-[1100] flex items-end bg-black/50" onClick={onClose}>
      <div
        className="glass !rounded-b-none w-full animate-sheet-up !bg-glass-strong px-5 pt-3"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-white/25" />
        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-tight">
            {account.status === 'in' ? 'Account' : 'Sign in'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {!account.enabled ? (
          <p className="py-8 text-center text-[14px] text-white/60">
            Accounts aren’t set up on this deployment yet. You’re playing as a guest.
          </p>
        ) : account.status === 'in' ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/[0.07] px-4 py-3">
              <div className="text-[16px] font-semibold">{account.profile?.handle}</div>
              <div className="text-[13px] text-white/50">{account.user?.email}</div>
            </div>
            <p className="text-[13px] text-white/50">
              Your scores follow you to any device you sign in on. Change your handle from the
              Ranks screen.
            </p>
            <button
              onClick={async () => {
                await account.signOut();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3.5 text-[15px] font-semibold active:scale-95"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <button
              onClick={google}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-black active:scale-95 disabled:opacity-50"
            >
              <GoogleMark /> Continue with Google
            </button>
            <div className="flex items-center gap-3 text-[12px] text-white/35">
              <span className="h-px flex-1 bg-white/15" /> or <span className="h-px flex-1 bg-white/15" />
            </div>

            {step === 'email' ? (
              <>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && sendCode()}
                  className={input}
                />
                <button
                  onClick={sendCode}
                  disabled={busy || !email.includes('@')}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aether-blue py-3.5 text-[15px] font-semibold active:scale-95 disabled:opacity-40"
                >
                  <Mail size={16} /> {busy ? 'Sending…' : 'Email me a code'}
                </button>
              </>
            ) : (
              <>
                <p className="text-[13px] text-white/60">
                  We sent a code to <span className="text-white">{email}</span>.
                </p>
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && code && verify()}
                  className={`${input} text-center tracking-[0.3em]`}
                />
                <button
                  onClick={verify}
                  disabled={busy || code.length < 4}
                  className="w-full rounded-2xl bg-aether-blue py-3.5 text-[15px] font-semibold active:scale-95 disabled:opacity-40"
                >
                  {busy ? 'Verifying…' : 'Verify & sign in'}
                </button>
                <button
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                  }}
                  className="w-full text-[13px] text-white/50"
                >
                  Use a different email
                </button>
              </>
            )}
            {error && <p className="text-center text-[13px] text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
