'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '@/context/useAuthStore';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Loader2, Mail, Lock, User, Phone, ArrowRight, Github, Chrome } from 'lucide-react';

type View = 'login' | 'signup';

const clientGoogleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function AuthPage() {
  const router = useRouter();
  const { login, loginGoogle, signup } = useAuth();
  const { token, isHydrated } = useAuthStore();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Signup fields
  const [signupNom, setSignupNom] = useState('');
  const [signupEma, setSignupEma] = useState('');
  const [signupPas, setSignupPas] = useState('');
  const [signupTel, setSignupTel] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isHydrated) return;

    const cookieToken = getCookie('kamba_token');
    if (token || cookieToken) {
      router.replace('/dashboard');
    }
  }, [isMounted, isHydrated, token, router]);

  function switchView(v: View) {
    setError('');
    setSuccess('');
    setView(v);
  }

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(loginUser, loginPass);
      if (!res.success) {
        setError(res.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginGoogle(credential: string) {
    setLoading(true);
    setError('');
    try {
      const res = await loginGoogle(credential);
      if (!res.success) {
        setError(res.message || 'Error al autenticar con Google');
      }
    } catch (err) {
      setError('Error al procesar el inicio de sesión con Google');
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
      const res = await signup(signupNom, signupEma, signupPas, signupTel);
      if (!res.success) {
        setError(res.message || 'Error al registrar usuario');
        return;
      }
      setSuccess('¡Cuenta creada! Redirigiendo al inicio de sesión...');
      setSignupNom('');
      setSignupEma('');
      setSignupPas('');
      setSignupTel('');
      setTimeout(() => switchView('login'), 2000);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  if (!isMounted) return null;

  return (
    <GoogleOAuthProvider clientId={clientGoogleId}>
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0a] font-sans selection:bg-indigo-500/30">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />

        <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-700">
          <div className="bg-white/[0.03] dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500">
            {/* View Toggle */}
            <div className="flex p-2 bg-white/5 mx-6 mt-6 rounded-2xl">
              <button
                onClick={() => switchView('login')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${view === 'login'
                  ? 'bg-white text-zinc-950 shadow-lg scale-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 scale-95 opacity-70'
                  }`}
              >
                INGRESAR
              </button>
              <button
                onClick={() => switchView('signup')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${view === 'signup'
                  ? 'bg-white text-zinc-950 shadow-lg scale-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 scale-95 opacity-70'
                  }`}
              >
                REGISTRARSE
              </button>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {success}
                </div>
              )}

              {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-4 mb-6">
                    <div className="group">
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 transition-colors group-focus-within:text-indigo-400">
                        Usuario o Correo
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-indigo-400" />
                        <input
                          type="text"
                          required
                          value={loginUser}
                          onChange={(e) => setLoginUser(e.target.value)}
                          placeholder="tu@correo.com"
                          className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-400">
                          Contraseña
                        </label>
                        <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">
                          ¿Olvidaste la clave?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-indigo-400" />
                        <input
                          type="password"
                          required
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-gray-400 to-black-400 rounded-2xl text-sm font-bold text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        INICIAR SESIÓN
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-[#121212] px-3 text-zinc-600">O ingresa con</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <GoogleLogin
                      onSuccess={(res) => res.credential && handleLoginGoogle(res.credential)}
                      onError={() => setError('Error al autenticar con Google')}
                    />
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 group-focus-within:text-indigo-400">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-indigo-400" />
                        <input
                          type="text"
                          required
                          value={signupNom}
                          onChange={(e) => setSignupNom(e.target.value)}
                          placeholder="Nombre"
                          className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 group-focus-within:text-indigo-400">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-indigo-400" />
                        <input
                          type="tel"
                          value={signupTel}
                          onChange={(e) => setSignupTel(e.target.value)}
                          placeholder="999..."
                          className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 group-focus-within:text-indigo-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-indigo-400" />
                      <input
                        type="email"
                        required
                        value={signupEma}
                        onChange={(e) => setSignupEma(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 group-focus-within:text-indigo-400">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-indigo-400" />
                      <input
                        type="password"
                        required
                        value={signupPas}
                        onChange={(e) => setSignupPas(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-white text-zinc-950 rounded-2xl text-sm font-bold shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all duration-300 mt-4 h-12"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-950" /> : 'UNIRSE A KAMBA'}
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center px-4 leading-relaxed">
                    Al registrarte, aceptas nuestros <span className="text-zinc-400 font-bold hover:underline cursor-pointer">Términos de Servicio</span> y <span className="text-zinc-400 font-bold hover:underline cursor-pointer">Política de Privacidad</span>.
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="mt-8 text-center text-zinc-600 text-xs font-medium tracking-wide">
            © 2026 KAMBA TEAM &middot; TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
