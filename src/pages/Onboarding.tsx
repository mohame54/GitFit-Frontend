import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { ErrorBox, Spinner } from '@/components/ui/Feedback';
import { useChat } from '@/hooks/useChat';

/**
 * Onboarding starts a chat session with the main agent:
 * POST /api/agent/chat + X-User-Id, body { message } only (no sessionId).
 * Then navigates to /chat with the returned sessionId saved locally.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { markOnboardingComplete, profileId } = useAuth();
  const { startOnboardingSession } = useChat();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const autoStarted = useRef(false);

  const startWithAi = useCallback(async () => {
    if (!profileId) {
      setError('Missing meals profile id. Sign in again.');
      return;
    }

    setStarting(true);
    setError(null);
    try {
      await startOnboardingSession();
      await markOnboardingComplete();
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start preference setup chat',
      );
    } finally {
      setStarting(false);
    }
  }, [markOnboardingComplete, navigate, profileId, startOnboardingSession]);

  useEffect(() => {
    if (!profileId || autoStarted.current) return;
    autoStarted.current = true;
    void startWithAi();
  }, [profileId, startWithAi]);

  async function skip() {
    setSkipping(true);
    setError(null);
    try {
      await markOnboardingComplete();
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding');
    } finally {
      setSkipping(false);
    }
  }

  const busy = starting || skipping;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-brand-700">Optional setup</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Setting up your food preferences
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Starting a chat with the GetFit agent. You can skip and manage
          constraints or preferences later in Profile.
        </p>

        {error ? (
          <div className="mt-4">
            <ErrorBox message={error} />
          </div>
        ) : null}

        {starting && !error ? (
          <Spinner label="Starting preference chat…" />
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {error ? (
            <Button type="button" onClick={startWithAi} disabled={busy}>
              Try again
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={skip}
            disabled={busy && !error}
          >
            {skipping ? 'Skipping…' : 'Skip for now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
