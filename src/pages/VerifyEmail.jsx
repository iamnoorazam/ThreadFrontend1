import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { parseErrorMessage } from '../utils/format';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState({ status: token ? 'loading' : 'error', message: 'This link is incomplete.' });
  // The token works once, so a dev-mode double render must not spend it twice.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api
      .post('/auth/verify-email', { token })
      .then(() => setState({ status: 'ok', message: '' }))
      .catch((err) =>
        setState({ status: 'error', message: parseErrorMessage(err, 'This verification link is invalid or has expired.') })
      );
  }, [token]);

  if (state.status === 'loading') return <Spinner />;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <p className="overline-label text-brand-700">Email</p>
      <h1 className="mt-2 font-display text-4xl text-ink">
        {state.status === 'ok' ? 'Email confirmed' : 'Couldn’t confirm your email'}
      </h1>
      <p className="mt-3 text-sm text-ink-light">
        {state.status === 'ok'
          ? 'Thanks. We can now reach you about your orders.'
          : `${state.message} Log in and use “Resend” on your account page to get a fresh link.`}
      </p>
      <Link to="/dashboard" className="btn-primary mt-7 inline-flex">Go to my account</Link>
    </div>
  );
}
