'use client';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '@/context/theme';

export const GOOGLE_ENABLED = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleButton({ onToken, onError }: { onToken: (idToken: string) => void; onError: () => void }) {
  const { theme } = useTheme();
  if (!GOOGLE_ENABLED) return null;
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(res) => (res.credential ? onToken(res.credential) : onError())}
        onError={onError}
        theme={theme === 'dark' ? 'filled_black' : 'outline'}
        shape="pill"
        width="320"
      />
    </div>
  );
}
