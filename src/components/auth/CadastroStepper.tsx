'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Phone, MapPin, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatCEP, formatPhone } from '@/lib/utils/formatters';

export const CadastroStepper: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const { buscarCEP, endereco, loading: loadingCep } = useGeolocation();
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      await buscarCEP(formatted);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('As senhas digitadas não coincidem.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    // Simula criação de usuário e redireciona para o feed
    setTimeout(() => {
      setLoadingSubmit(false);
      router.push('/feed');
    }, 600);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
          Conecta
        </h1>
        <p className="text-xs text-gray-500">
          Cadastro de Cidadão - Etapa {step} de 2
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center space-x-2 pt-2">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-emerald-600' : 'w-4 bg-emerald-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-emerald-600' : 'w-4 bg-gray-200'}`} />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: Maria Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Seu melhor E-mail"
            type="email"
            placeholder="maria@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Criar Senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />

          <Button type="submit" variant="primary" className="w-full rounded-xl py-3 font-bold mt-2">
            <span>Avançar para Geolocalização</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <Input
            label="Telefone Celular (para validação OTP)"
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
            required
          />

          <div>
            <Input
              label="CEP Residencial (Vínculo de Bairro)"
              placeholder="00000-000"
              value={cep}
              onChange={handleCepChange}
              leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
              required
            />
            {loadingCep && (
              <p className="text-[10px] text-gray-400 mt-1">Buscando endereço pelo CEP...</p>
            )}
            {endereco && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bairro Detectado: {endereco.bairro}</p>
                  <p className="text-[11px] text-emerald-700">
                    {endereco.localidade} - {endereco.uf}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">Seu nível inicial será: Nível 1</p>
            <p>Você poderá comentar, curtir e postar zeladoria. A validação de comprovante (Nível 2) poderá ser feita no seu perfil para liberar votos em leis.</p>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Voltar</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 rounded-xl font-bold"
              isLoading={loadingSubmit}
            >
              Concluir Cadastro
            </Button>
          </div>
        </form>
      )}

      <div className="text-center text-xs text-gray-600">
        Já possui conta?{' '}
        <Link href="/login" className="text-emerald-600 font-bold hover:underline">
          Fazer Login
        </Link>
      </div>
    </div>
  );
};

