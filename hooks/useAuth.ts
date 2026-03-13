import { setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import {
  skambaLogin,
  skambaReLogin,
  skambaLoginGoogle,
  skambaCreateUser,
} from '@/lib/api/auth';
import { useAuthStore } from '@/context/useAuthStore';

export const useAuth = () => {
  const router = useRouter();
  const { setUser, setToken, logout: clearStore } = useAuthStore();

  const login = async (user: string, pass: string) => {
    try {
      const response = await skambaLogin(user, pass);

      if (response.success && response.token) {
        setCookie('kamba_token', response.token, {
          maxAge: 60 * 60 * 24,
          path: '/',
          sameSite: 'lax',
          secure: false,
        });
        const data = response.data;
        const meta = response.meta;

        const mappedUser = {
          usu_ide: Number(data?.id || 0),
          usu_nom: data?.nombre || meta?.usuario || '',
          usu_ema: data?.usuario || '',
        };

        setUser(mappedUser as any);
        setToken(response.token);

        router.replace('/dashboard');
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const loginGoogle = async (credential: string) => {
    try {
      const response = await skambaLoginGoogle(credential);
      if (response.success && response.token) {
        setCookie('kamba_token', response.token, {
          maxAge: 60 * 60 * 24,
          path: '/',
          sameSite: 'lax',
          secure: false,
        });
        const data = response.data;
        const meta = response.meta;

        const mappedUser = {
          usu_ide: Number(data?.id || 0),
          usu_nom: data?.nombre || meta?.usuario || '',
          usu_ema: data?.usuario || '',
        };

        setUser(mappedUser as any);
        setToken(response.token);

        router.replace('/dashboard');
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Error en autenticación con Google' };
    }
  };

  const signup = async (
    nombre: string,
    email: string,
    pass: string,
    tel: string,
  ) => {
    try {
      const response = await skambaCreateUser(nombre, email, pass, tel);
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  };

  const revalidate = async () => {
    try {
      const response = await skambaReLogin();
      if (response.success && response.token) {
        setToken(response.token);
        // Podríamos actualizar el usuario aquí si la API lo devuelve
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Revalidation error:', error);
      logout();
      return false;
    }
  };

  const logout = () => {
    deleteCookie('kamba_token');
    clearStore();
    router.push('/login');
  };

  return { login, loginGoogle, signup, logout, revalidate };
};
