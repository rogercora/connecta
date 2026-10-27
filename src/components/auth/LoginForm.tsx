'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    router.push('/feed');
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Logo */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Cidadão <span className="text-emerald-600">Connect</span>
        </h1>
        <p className="text-xs text-gray-500">
          Sua voz, seu bairro, sua cidade em tempo real.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail ou Telefone"
          type="text"
          placeholder="exemplo@email.com ou (11) 98765-4321"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
          required
        />

        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Lembrar de mim</span>
          </label>

          <Link
            href="/recuperar-senha"
            className="text-emerald-600 hover:underline font-medium"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full rounded-xl py-3 font-bold"
          isLoading={loading}
        >
          Entrar na Comunidade
        </Button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-xs text-gray-400 uppercase font-medium absolute">
          ou
        </span>
      </div>

      <div className="text-center text-xs text-gray-600">
        Não possui uma conta?{' '}
        <Link href="/cadastro" className="text-emerald-600 font-bold hover:underline">
          Cadastre-se gratuitamente
        </Link>
      </div>

      <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 border border-gray-100">
        🔒 <strong>Acesso Cidadão:</strong> Seus dados de endereço são vinculados estritamente para entrega de pautas do seu CEP, em conformidade com a LGPD.
      </div>
    </div>
  );
};

