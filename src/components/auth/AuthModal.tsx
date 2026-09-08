import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { AuthServices } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'magiclink') {
        const { error } = await AuthServices.signInWithMagicLink(email.trim());
        if (error) throw error;
        setSuccessMsg('Enviamos um link mágico de login para o seu e-mail! Basta clicar nele para acessar.');
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('A senha deve conter pelo menos 6 caracteres.');
        }
        const { data, error } = await AuthServices.signUpWithEmail(email.trim(), password);
        if (error) throw error;
        if (data.session) {
          onAuthSuccess(data.user);
          onClose();
        } else {
          setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail de confirmação ou faça login.');
          setMode('signin');
        }
      } else {
        const { data, error } = await AuthServices.signInWithEmail(email.trim(), password);
        if (error) throw error;
        if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await AuthServices.signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft flex items-center justify-center text-accent-text">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {mode === 'signin' && 'Entrar na sua Conta'}
                {mode === 'signup' && 'Criar sua Conta'}
                {mode === 'magiclink' && 'Login com Link Mágico'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Sincronize suas tarefas em qualquer dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-surface-border p-1 bg-background/50">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('magiclink'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'magiclink'
                ? 'bg-surface text-accent-text shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Link Mágico
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google 1-Click Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-surface-hover hover:bg-muted border border-surface-border text-foreground text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.6 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-[11px] text-muted-foreground uppercase font-medium">ou com e-mail</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              E-mail
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-muted-foreground/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-surface-border text-foreground text-xs focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Password (if not magic link) */}
          {mode !== 'magiclink' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Senha
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('magiclink')}
                    className="text-[11px] text-accent-text hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-muted-foreground/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta (min. 6 caracteres)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-surface-border text-foreground text-xs focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>
              {loading ? 'Processando...' : 
               mode === 'signin' ? 'Entrar no Plannerm' : 
               mode === 'signup' ? 'Criar Conta Gratuita' : 
               'Enviar Link Mágico'}
            </span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>

          {/* Guest / Continue without login */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar usando como visitante (offline)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
