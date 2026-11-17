'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatCEP, formatPhone } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.';
  }
  if (lower.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lower.includes('duplicate key value') && lower.includes('phone')) {
    return 'Este número de celular já está vinculado a outra conta.';
  }
  return message;
}

export const CadastroStepper: React.FC = () => {
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const { buscarCEP, endereco, loading: loadingCep } = useGeolocation();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const prefilledCepRef = useRef(false);

  useEffect(() => {
    if (prefilledCepRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const cepParam = params.get('cep');
    if (cepParam) {
      const formatted = formatCEP(cepParam);
      if (formatted.replace(/\D/g, '').length === 8) {
        prefilledCepRef.current = true;
        setCep(formatted);
        void buscarCEP(formatted);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      await buscarCEP(formatted);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cepDigitos = cep.replace(/\D/g, '');
    if (cepDigitos.length !== 8) {
      setErrorMsg('Informe um CEP válido com 8 dígitos.');
      return;
    }

    const phoneDigitos = phone.replace(/\D/g, '');
    if (phoneDigitos.length < 10) {
      setErrorMsg('Informe um número de celular válido com DDD.');
      return;
    }

    if (!aceiteLgpd) {
      setErrorMsg('É necessário aceitar o uso dos dados geográficos conforme a LGPD.');
      return;
    }

    setLoadingSubmit(true);

    try {
      const cepFormatado = formatCEP(cepDigitos);
      const cidadeFinal = endereco?.localidade || 'São José dos Campos';
      const estadoFinal = (endereco?.uf || 'SP').toUpperCase().slice(0, 2);
      const bairroFinal = endereco?.bairro || 'Centro';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            nome_completo: nome.trim(),
            phone: phoneDigitos,
            cep: cepFormatado,
            bairro: bairroFinal,
            cidade: cidadeFinal,
            estado: estadoFinal,
          },
        },
      });

      if (error) {
        setErrorMsg(mapSignUpError(error.message));
        setLoadingSubmit(false);
        return;
      }

      if (data.session) {
        await refreshProfile();
        setLoadingSubmit(false);
        router.push('/feed');
        router.refresh();
        return;
      }

      // Caso a confirmação por e-mail esteja ativada no projeto Supabase
      setLoadingSubmit(false);
      setAwaitingEmailConfirm(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao criar sua conta. Tente novamente.');
      setLoadingSubmit(false);
    }
  };

  if (awaitingEmailConfirm) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-5 text-center">
        <div className="w-14 h-14 bg-crimson-50 border border-crimson-200 text-crimson-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900">Confirme seu E-mail</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Enviamos um link de confirmação para <strong>{email}</strong>. Abra o link recebido e depois faça login para acessar seu bairro.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full rounded-xl py-3 px-4 font-bold text-xs bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
        >
          Ir para o Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center space-x-2">
          <span className="w-8 h-8 rounded-xl bg-crimson-600 text-white flex items-center justify-center font-black shadow-crimson-btn">
            📢
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
            Conecta<span className="text-crimson-600">Br</span>
          </h1>
        </div>
        <p className="text-xs text-gray-500">
          Cadastro de Cidadão - Etapa {step} de 2
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center space-x-2 pt-2">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-crimson-600' : 'w-4 bg-crimson-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-crimson-600' : 'w-4 bg-gray-200'}`} />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: Carlos Eduardo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Seu melhor E-mail"
            type="email"
            placeholder="carlos@exemplo.com"
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
            label="Telefone Celular"
            placeholder="(12) 98765-4321"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
            required
          />

          <div>
            <Input
              label="CEP Residencial (Vínculo de Bairro)"
              placeholder="12246-021"
              value={cep}
              onChange={handleCepChange}
              leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
              required
            />
            {loadingCep && (
              <p className="text-[10px] text-gray-400 mt-1">Buscando endereço pelo CEP...</p>
            )}

            {endereco && (
              <>
                {endereco.isSJC ? (
                  <div className="mt-2.5 p-3.5 bg-crimson-50 border border-crimson-200 rounded-2xl flex items-start space-x-2 text-xs text-crimson-900 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-crimson-800">
                        🎉 Piloto Oficial Ativo em SJC!
                      </p>
                      <p className="text-[11px] text-crimson-700">
                        Bairro: <strong>{endereco.bairro}</strong> ({endereco.localidade} - {endereco.uf})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2 text-xs text-amber-900 shadow-sm">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-amber-800">
                        🚀 Cidade em Desbloqueio Comunitário!
                      </p>
                      <p className="text-[11px] text-amber-700">
                        {endereco.localidade} - {endereco.uf}. Ao concluir, você verá a meta da sua cidade e poderá convidar vizinhos para liberá-la.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">Seu nível inicial será: Nível 1</p>
            <p>Você poderá comentar, apoiar e postar zeladoria. A validação Nível 2 é auditada pela moderação para liberar votos em decisões da Câmara.</p>
          </div>

          <label className="flex items-start space-x-2 text-[11px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={aceiteLgpd}
              onChange={(e) => setAceiteLgpd(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-crimson-600 focus:ring-crimson-500"
            />
            <span>
              Concordo com o tratamento de meu e-mail, telefone e CEP exclusivamente para participação cívica local (LGPD).
            </span>
          </label>

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrorMsg(null);
                setStep(1);
              }}
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
        <Link href="/login" className="text-crimson-600 font-bold hover:underline">
          Fazer Login
        </Link>
      </div>
    </div>
  );
};
