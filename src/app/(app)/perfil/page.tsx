'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, MapPin, Phone, Mail, Award, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isNivel2, setNivelVerificacao, logout } = useAuth();

  const handleToggleNivel = () => {
    // Permite alternar para demonstrar e testar facilmente o comportamento do sistema
    setNivelVerificacao(isNivel2 ? 1 : 2);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Card do Usuário */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center relative overflow-hidden">
        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-emerald-100 mb-3 border-2 border-emerald-500">
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.nome_completo}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-emerald-800 text-xl">
              MS
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-base text-gray-900">
          {user?.nome_completo || 'Maria Silva'}
        </h3>
        <p className="text-xs text-gray-500">
          Moradora do {user?.bairro || 'Ipiranga'} • {user?.cidade || 'São Paulo'} - {user?.estado || 'SP'}
        </p>

        {/* Badge de Nível */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {isNivel2 ? 'Nível 2: Cidadã Verificada' : 'Nível 1: Usuário Cadastrado'}
          </span>
        </div>
      </div>

      {/* Regras e Simulação de Níveis de Verificação */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Nível de Cidadania & Antifraude
          </h4>
          <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
            Simulador
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className={`p-3 rounded-xl border transition-all ${!isNivel2 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800">Nível 1 (Básico)</span>
              {!isNivel2 && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Validação por Telefone + CEP. Pode visualizar os feeds, comentar e publicar zeladorias urbanas.
            </p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${isNivel2 ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800">Nível 2 (Cidadão Verificado)</span>
              {isNivel2 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Comprovante de residência / Prova de vida auditada. Libera voto direto nas pautas da Câmara e assinatura em petições públicas.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleToggleNivel}
          className="w-full rounded-xl text-xs font-semibold py-2"
        >
          Alternar Nível ({isNivel2 ? 'Mudar para Nível 1' : 'Verificar como Nível 2'})
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
          <p className="text-base font-black text-gray-900">1</p>
          <p className="text-[10px] text-gray-500 font-medium">Zeladorias</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
          <p className="text-base font-black text-emerald-600">4</p>
          <p className="text-[10px] text-gray-500 font-medium">Votos em Leis</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
          <p className="text-base font-black text-blue-600">1</p>
          <p className="text-[10px] text-gray-500 font-medium">Petição Ativa</p>
        </div>
      </div>

      {/* Botão de Logout */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl py-2.5 font-bold text-xs"
      >
        <LogOut className="w-4 h-4 mr-1.5" />
        <span>Sair da Conta</span>
      </Button>
    </div>
  );
}

