'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { skambaLogin, skambaCreateUser } from '../lib/api';

type View = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Signup fields
  const [signupNom, setSignupNom] = useState('');
  const [signupEma, setSignupEma] = useState('');
  const [signupPas, setSignupPas] = useState('');
  const [signupTel, setSignupTel] = useState('');

  function switchView(v: View) {
    setView(v);
    setError('');
    setSuccess('');
  }

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await skambaLogin(loginUser, loginPass);
      if (!res.success) {
        setError(res.message || 'Credenciales incorrectas');
        return;
      }
      const token = res.token ?? res.meta?.token;
      const usu_ide = res.data?.id;
      if (token) {
        localStorage.setItem('sk_token', token);
        localStorage.setItem('sk_usu_ide', String(usu_ide ?? ''));
        localStorage.setItem('sk_user', JSON.stringify(res.data ?? {}));
      }
      router.push('/dashboard');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await skambaCreateUser(signupNom, signupEma, signupPas, signupTel);
      if (!res.success) {
        setError(res.message || 'Error al registrar usuario');
        return;
      }
      setSuccess('Cuenta creada. Ahora puedes iniciar sesion.');
      setSignupNom('');
      setSignupEma('');
      setSignupPas('');
      setSignupTel('');
      setTimeout(() => switchView('login'), 1500);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => switchView('login')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              view === 'login'
                ? 'text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Iniciar sesion
          </button>
          <button
            onClick={() => switchView('signup')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              view === 'signup'
                ? 'text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Registrarse
          </button>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            {view === 'login' ? 'Bienvenido' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {view === 'login'
              ? 'Ingresa tus datos para continuar'
              : 'Completa el formulario para registrarte'}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Usuario o correo
                </label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contrasena
                </label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={signupNom}
                  onChange={(e) => setSignupNom(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Correo electronico
                </label>
                <input
                  type="email"
                  required
                  value={signupEma}
                  onChange={(e) => setSignupEma(e.target.value)}
                  placeholder="usuario@email.com"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contrasena
                </label>
                <input
                  type="password"
                  required
                  value={signupPas}
                  onChange={(e) => setSignupPas(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={signupTel}
                  onChange={(e) => setSignupTel(e.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
