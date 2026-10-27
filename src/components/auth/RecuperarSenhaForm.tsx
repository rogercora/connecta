'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const RecuperarSenhaForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Recuperar <span className="text-emerald-600">Acesso</span>
        </h1>
        <p className="text-xs text-gray-500">
          Informe seu e-mail cadastrado para receber o link de redefinição de senha.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-emerald-900 text-sm">E-mail Enviado!</h3>
          <p className="text-xs text-emerald-700">
            Enviamos um link de redefinição para <strong>{email}</strong>. Verifique também sua caixa de spam.
          </p>
          <Link
            href="/login"
            className="inline-block text-xs font-bold text-emerald-700 underline pt-2"
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
              className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-emerald-600"
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

