import React, { useState } from 'react';
import { PANDABIO_ASSETS } from '../constants/assets';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { AuthService } from '../supabase/services/authService';
import { isSupabaseConfigured } from '../supabase/client';

interface AuthScreenProps {
  onLoginSuccess: (user: Partial<UserProfile>) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Register mode
        if (isSupabaseConfigured()) {
          const result = await AuthService.signUp(
            regEmail,
            regPassword,
            {
              name: regName,
              username: regUsername,
              email: regEmail,
            }
          );

          if (result.success && result.user) {
            onLoginSuccess(result.user);
          } else {
            setErrorMessage(result.error || 'Erro ao fazer cadastro');
          }
        } else {
          // Fallback local mode
          onLoginSuccess({
            name: regName || 'Usuário',
            username: regUsername || (regEmail ? regEmail.split('@')[0] : 'usuario'),
            email: regEmail || 'usuario@email.com',
          });
        }
      } else {
        // Login mode
        if (isSupabaseConfigured()) {
          const email = identifier.trim();
          const result = await AuthService.signIn(email, password);

          if (result.success && result.user) {
            onLoginSuccess(result.user);
          } else {
            setErrorMessage(result.error || 'Erro ao fazer login');
          }
        } else {
          // Fallback local mode
          const email = identifier.trim() || 'usuario@email.com';
          const defaultName = email.includes('@') ? email.split('@')[0] : email;
          const defaultUsername = email.includes('@') ? email.split('@')[0] : email;
          onLoginSuccess({
            name: defaultName,
            username: defaultUsername,
            email: email.includes('@') ? email : `${email}@email.com`,
          });
        }
      }
    } catch {
      setErrorMessage('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        let result;
        if (provider === 'Google') {
          result = await AuthService.signInWithGoogle();
        } else {
          result = await AuthService.signInWithFacebook();
        }

        if (result.success) {
          // OAuth redirecionará o usuário para o provedor
          // Após o redirect, o handleSessionCallback será chamado
          // Por enquanto, mostramos mensagem de redirecionamento
          setErrorMessage(`Redirecionando para ${provider}...`);
        } else {
          setErrorMessage(result.error || `Erro ao fazer login com ${provider}`);
        }
      } else {
        // Fallback local mode
        onLoginSuccess({
          name: `Usuário ${provider}`,
          username: `user_${provider.toLowerCase()}`,
          email: `user.${provider.toLowerCase()}@email.com`,
        });
      }
    } catch {
      setErrorMessage('Erro ao fazer login social');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-screen-wrapper"
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 relative"
      style={{
        backgroundColor: '#F6EFE9',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(255, 94, 0, 0.06) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(255, 94, 0, 0.08) 0%, transparent 45%)
        `,
      }}
    >


      {/* Main Login Card */}
      <motion.main
        id="auth-container"
        layout
        transition={{
          layout: { type: 'spring', stiffness: 260, damping: 28 },
        }}
        className="w-full max-w-5xl bg-white rounded-3xl lg:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative border border-black/5"
      >
        {/* Branding Column */}
        <motion.section
          id="brand-panel"
          layout
          transition={{
            layout: { type: 'spring', stiffness: 260, damping: 28 },
          }}
          className={`lg:col-span-5 bg-[#111111] relative text-white flex flex-col justify-between overflow-hidden p-6 sm:p-8 lg:p-10 min-h-[280px] sm:min-h-[400px] lg:min-h-full z-20 ${
            isRegisterMode ? 'lg:order-2' : 'lg:order-1'
          }`}
        >
          {/* Top-right decorative orange circle */}
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#FF5E00] z-0 opacity-95 pointer-events-none"
            animate={{
              scale: isRegisterMode ? [1, 1.15, 1] : [1, 1.05, 1],
              rotate: isRegisterMode ? 90 : 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Top content */}
          <div className="relative z-10 space-y-3 sm:space-y-5">
            {/* Logo PandaBio */}
            <div className="flex items-center gap-2.5">
              <img
                src={PANDABIO_ASSETS.authLogo}
                alt="PandaBio"
                className="h-10 sm:h-12 lg:h-14 w-auto object-contain drop-shadow-sm"
              />
            </div>

            {/* Title & Tagline with AnimatePresence */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegisterMode ? 'register-brand-text' : 'login-brand-text'}
                initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5 pt-1 sm:pt-2"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  Sua bio. Seu mundo.
                  <br />
                  <span className="text-[#FF5E00]">Um só link.</span>
                </h1>
                <p className="text-gray-300 text-xs sm:text-sm lg:text-base font-normal pt-1 sm:pt-1.5 max-w-sm leading-relaxed">
                  {isRegisterMode
                    ? 'Crie sua página PandaBio personalizada e una todas as suas redes agora mesmo.'
                    : 'Acesse sua página PandaBio e continue conectando tudo em um só lugar.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mascot 3D Image at bottom with gentle floating and mode change */}
          <motion.div
            className="relative z-10 w-full flex justify-center items-end mt-3 -mb-8 sm:-mb-12 pointer-events-none select-none"
            animate={{
              y: [0, -6, 0],
              scale: isRegisterMode ? 1.08 : 1.05,
            }}
            transition={{
              y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' },
              scale: { duration: 0.4, ease: 'easeOut' },
            }}
          >
            <img
              src={PANDABIO_ASSETS.mascot3D}
              alt="Mascote 3D PandaBio"
              className="w-48 sm:w-72 lg:w-88 object-cover object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* Ambient Glow */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0" />
        </motion.section>

        {/* Form Column */}
        <motion.section
          id="forms-panel"
          layout
          transition={{
            layout: { type: 'spring', stiffness: 260, damping: 28 },
          }}
          className={`lg:col-span-7 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-center relative overflow-hidden z-10 ${
            isRegisterMode ? 'lg:order-1' : 'lg:order-2'
          }`}
        >
          {/* Decorative subtle dot */}
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#FF5E00]/10 pointer-events-none hidden sm:block" />

          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Pill Tab Switcher with smooth sliding motion */}
            <div className="p-1 bg-[#F1F3F6] rounded-2xl flex items-center relative select-none">
              <button
                type="button"
                id="tab-btn-login"
                onClick={() => setIsRegisterMode(false)}
                className={`relative z-10 flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  !isRegisterMode ? 'text-[#151515]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Entrar
                {!isRegisterMode && (
                  <motion.div
                    layoutId="active-auth-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs z-[-1]"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
              </button>
              <button
                type="button"
                id="tab-btn-register"
                onClick={() => setIsRegisterMode(true)}
                className={`relative z-10 flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isRegisterMode ? 'text-[#151515]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cadastrar
                {isRegisterMode && (
                  <motion.div
                    layoutId="active-auth-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs z-[-1]"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
              </button>
            </div>

            {/* Form View with AnimatePresence slide transitions */}
            <div className="relative min-h-[470px]">
              <AnimatePresence mode="wait" initial={false}>
                {!isRegisterMode ? (
                  <motion.div
                    key="pane-login"
                    id="pane-login"
                    initial={{ opacity: 0, x: -28, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 28, filter: 'blur(3px)' }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-3xl font-extrabold text-[#151515] tracking-tight">
                        Entrar na sua conta
                      </h2>
                      <p className="text-sm text-gray-500 font-medium">
                        Bem-vindo de volta! Insira seus dados para continuar.
                      </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        id="btn-google-login"
                        onClick={() => handleSocialLogin('Google')}
                        className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition duration-150 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Continuar com Google</span>
                      </button>

                      <button
                        type="button"
                        id="btn-facebook-login"
                        onClick={() => handleSocialLogin('Facebook')}
                        className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition duration-150 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span>Continuar com Facebook</span>
                      </button>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center my-3">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="flex-shrink mx-3 text-xs text-gray-400 font-medium tracking-wide uppercase">
                        ou com seus dados
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="login-identifier"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          E-mail ou nome de usuário
                        </label>
                        <input
                          id="login-identifier"
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="seu@email.com ou @usuario"
                          className="w-full px-4 py-3 bg-[#F1F3F6] border-0 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FF5E00] transition duration-150 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="login-password"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-4 py-3 bg-[#F1F3F6] border-0 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FF5E00] transition duration-150 outline-none pr-11"
                          />
                          <button
                            type="button"
                            aria-label="Exibir ou ocultar senha"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded text-[#FF5E00] focus:ring-[#FF5E00] border-gray-300 transition duration-150 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">
                            Lembrar de mim
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            const email = identifier.trim();
                            if (!email || !email.includes('@')) {
                              setErrorMessage('Por favor, insira um e-mail válido');
                              return;
                            }
                            
                            if (isSupabaseConfigured()) {
                              const result = await AuthService.resetPassword(email);
                              if (result.success) {
                                alert('Link de redefinição de senha enviado para o e-mail informado!');
                              } else {
                                setErrorMessage(result.error || 'Erro ao enviar link de redefinição');
                              }
                            } else {
                              alert('Link de redefinição de senha enviado para o e-mail informado!');
                            }
                          }}
                          className="text-xs sm:text-sm font-semibold text-[#FF5E00] hover:underline transition duration-150 cursor-pointer"
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-login"
                        disabled={isLoading}
                        className="w-full py-3.5 px-6 bg-[#FF5E00] hover:bg-[#E55300] active:scale-[0.99] text-white text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : (
                          'Entrar'
                        )}
                      </button>
                    </form>

                    {/* Footer Switch */}
                    <div className="text-center pt-1 text-xs sm:text-sm text-gray-600 font-medium">
                      Não tem uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(true)}
                        className="font-bold text-[#FF5E00] hover:underline ml-1 cursor-pointer"
                      >
                        Cadastre-se
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Form View: CADASTRO */
                  <motion.div
                    key="pane-register"
                    id="pane-register"
                    initial={{ opacity: 0, x: 28, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -28, filter: 'blur(3px)' }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h2 className="text-3xl font-extrabold text-[#151515] tracking-tight">
                        Crie sua conta
                      </h2>
                      <p className="text-sm text-gray-500 font-medium">
                        Conecte sua bio ao seu mundo em minutos.
                      </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition duration-150 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Cadastrar com Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Facebook')}
                        className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition duration-150 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span>Cadastrar com Facebook</span>
                      </button>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center my-3">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="flex-shrink mx-3 text-xs text-gray-400 font-medium tracking-wide uppercase">
                        ou com seus dados
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>

                    {/* Form */}
                    <form className="space-y-3.5" onSubmit={handleSubmit}>
                      <div className="space-y-1">
                        <label
                          htmlFor="reg-name"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          Nome completo
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Como podemos te chamar?"
                          className="w-full px-4 py-2.5 bg-[#F1F3F6] border-0 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FF5E00] transition duration-150 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="reg-email"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          E-mail
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-4 py-2.5 bg-[#F1F3F6] border-0 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FF5E00] transition duration-150 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="reg-username"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          Nome de usuário
                        </label>
                        <div className="flex items-center w-full px-3 py-2.5 bg-[#F1F3F6] rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5E00] transition duration-150">
                          <span className="text-xs sm:text-sm font-medium text-gray-400 select-none pl-1">
                            panda.bio/
                          </span>
                          <input
                            id="reg-username"
                            type="text"
                            required
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            placeholder="seunome"
                            className="w-full bg-transparent border-0 text-gray-800 text-sm placeholder-gray-400 focus:ring-0 outline-none p-0 pl-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="reg-password"
                          className="block text-xs sm:text-sm font-semibold text-gray-800"
                        >
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mínimo de 8 caracteres"
                            className="w-full px-4 py-2.5 bg-[#F1F3F6] border-0 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FF5E00] transition duration-150 outline-none pr-11"
                          />
                          <button
                            type="button"
                            aria-label="Exibir ou ocultar senha"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 pb-1">
                        <input
                          id="terms-check"
                          type="checkbox"
                          required
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="w-4 h-4 rounded text-[#FF5E00] focus:ring-[#FF5E00] border-gray-300 transition duration-150 cursor-pointer"
                        />
                        <label
                          htmlFor="terms-check"
                          className="text-xs text-gray-600 font-medium cursor-pointer select-none"
                        >
                          Aceito os{' '}
                          <span className="text-[#FF5E00] hover:underline font-semibold">
                            termos de uso
                          </span>{' '}
                          e a{' '}
                          <span className="text-[#FF5E00] hover:underline font-semibold">
                            política de privacidade
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-register"
                        disabled={isLoading}
                        className="w-full py-3.5 px-6 bg-[#FF5E00] hover:bg-[#E55300] active:scale-[0.99] text-white text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : (
                          'Criar conta'
                        )}
                      </button>
                    </form>

                    {/* Footer Switch */}
                    <div className="text-center pt-1 text-xs sm:text-sm text-gray-600 font-medium">
                      Já tem uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(false)}
                        className="font-bold text-[#FF5E00] hover:underline ml-1 cursor-pointer"
                      >
                        Entrar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

