'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';

export const RecuperarSenhaForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSubmitted(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setPasswordUpdated(true);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Recuperar <span className="text-crimson-600">Acesso</span>
        </h1>
        <p className="text-xs text-gray-500">
          {isRecoverySession
            ? 'Defina sua nova senha de acesso ao ConectaBr.'
            : 'Informe seu e-mail cadastrado para receber o link de redefinição de senha.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {passwordUpdated ? (
        <div className="p-4 bg-crimson-50 border border-crimson-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-crimson-600 mx-auto" />
          <h3 className="font-bold text-crimson-900 text-sm">Senha Atualizada!</h3>
          <p className="text-xs text-crimson-700">
            Sua senha foi alterada com sucesso. Você já pode entrar na plataforma.
          </p>
          <Link
            href="/feed"
            className="inline-block text-xs font-bold text-crimson-700 underline pt-2"
          >
            Ir para o Feed
          </Link>
        </div>
      ) : isRecoverySession ? (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full rounded-xl py-3 font-bold"
            isLoading={loading}
          >
            Salvar Nova Senha
          </Button>
        </form>
      ) : submitted ? (
        <div className="p-4 bg-crimson-50 border border-crimson-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-crimson-600 mx-auto" />
          <h3 className="font-bold text-crimson-900 text-sm">E-mail Enviado!</h3>
          <p className="text-xs text-crimson-700">
            Se existir conta associada a <strong>{email}</strong>, você receberá um link de redefinição. Verifique também sua caixa de spam.
          </p>
          <Link
            href="/login"
            className="inline-block text-xs font-bold text-crimson-700 underline pt-2"
          >
            Voltar ao Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu E-mail"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full rounded-xl py-3 font-bold"
            isLoading={loading}
          >
            Enviar Link de Recuperação
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-crimson-600"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Voltar para o Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
