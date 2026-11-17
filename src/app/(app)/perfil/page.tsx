'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  LogOut,
  Sparkles,
  ArrowRight,
  Lock,
  Camera,
  Pencil,
  Phone,
  User as UserIcon,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatCEP, formatPhone } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';

export default function PerfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading, isNivel2, isAdmin, logout, refreshProfile } = useAuth();
  const { buscarCEP, endereco, loading: loadingCep } = useGeolocation();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [zeladoriaCount, setZeladoriaCount] = useState(0);
  const [votosCount, setVotosCount] = useState(0);

  // Estado de upload de foto
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estado do formulário de edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [nomeInput, setNomeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [cepInput, setCepInput] = useState('');
  const [bairroInput, setBairroInput] = useState('');
  const [cidadeInput, setCidadeInput] = useState('');
  const [estadoInput, setEstadoInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setNomeInput(user.nome_completo || '');
    setPhoneInput(user.phone ? formatPhone(user.phone) : '');
    setCepInput(user.cep ? formatCEP(user.cep) : '');
    setBairroInput(user.bairro || '');
    setCidadeInput(user.cidade || '');
    setEstadoInput(user.estado || 'SP');
  }, [user]);

  useEffect(() => {
    if (!endereco) return;
    if (endereco.bairro) setBairroInput(endereco.bairro);
    if (endereco.localidade) setCidadeInput(endereco.localidade);
    if (endereco.uf) setEstadoInput(endereco.uf);
  }, [endereco]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    async function loadStats() {
      const [{ count: postsCount }, { count: votesCount }] = await Promise.all([
        supabase
          .from('posts_comunidade')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id),
        supabase
          .from('votos_pauta')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id),
      ]);

      if (!cancelled) {
        setZeladoriaCount(postsCount ?? 0);
        setVotosCount(votesCount ?? 0);
      }
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedbackError('Envie uma foto nos formatos JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedbackError('A foto de perfil deve ter no máximo 2 MB.');
      return;
    }

    setUploadingAvatar(true);

    try {
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const ext = extMap[file.type] || 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) {
        setFeedbackError('Não foi possível enviar a foto para o servidor. Verifique se o bucket "avatars" foi criado no Supabase.');
        return;
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: pub.publicUrl }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackError(resData.error || 'Erro ao salvar foto de perfil.');
        return;
      }

      await refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      setFeedbackSuccess('Foto de perfil atualizada com sucesso!');
    } catch {
      setFeedbackError('Erro inesperado ao atualizar foto de perfil.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCepEditChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCepInput(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      await buscarCEP(formatted);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setSavingProfile(true);

    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomeInput.trim(),
          phone: phoneInput.trim(),
          cep: cepInput.trim(),
          bairro: bairroInput.trim(),
          cidade: cidadeInput.trim(),
          estado: estadoInput.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackError(data.error || 'Não foi possível salvar os dados do perfil.');
        return;
      }

      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['cidade_status'] });

      setIsEditing(false);
      setFeedbackSuccess('Dados do perfil atualizados com sucesso!');
    } catch {
      setFeedbackError('Erro de conexão ao salvar alterações.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500">
        Carregando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-gray-900">Você ainda não entrou na sua conta</p>
        <p className="text-xs text-gray-500">
          Entre ou cadastre-se para acompanhar seus votos, protocolos e nível de cidadania.
        </p>
        <Link
          href="/login?next=/perfil"
          className="inline-flex items-center justify-center rounded-xl py-3 px-6 text-xs font-bold bg-crimson-600 text-white"
        >
          Entrar na Conta
        </Link>
      </div>
    );
  }

  const initials = user.nome_completo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Alertas de Feedback */}
      {feedbackSuccess && (
        <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-crimson-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </span>
          <button onClick={() => setFeedbackSuccess(null)} className="text-crimson-500 hover:text-crimson-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{feedbackError}</span>
          </span>
          <button onClick={() => setFeedbackError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Card do Usuário + Upload de Avatar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center relative overflow-hidden">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <div className="relative w-20 h-20 mx-auto mb-3">
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-crimson-50 border-2 border-crimson-600">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.nome_completo}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-crimson-800 text-xl">
                {initials || 'CB'}
              </div>
            )}

            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
            title="Alterar foto de perfil"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-crimson-600 hover:bg-crimson-700 text-white border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-extrabold text-base text-gray-900">
          {user.nome_completo}
        </h3>
        <p className="text-xs text-gray-500">
          Morador(a) do {user.bairro} • {user.cidade} - {user.estado}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 text-crimson-600" />
          <span>CEP {user.cep} • {user.email}</span>
        </p>

        {/* Badges separados: Cidadania vs Administração */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-crimson-50 text-crimson-700 border border-crimson-200">
            <ShieldCheck className="w-3.5 h-3.5 text-crimson-600" />
            <span>
              {isNivel2 ? 'Nível 2: Cidadão Verificado' : 'Nível 1: Usuário Cadastrado'}
            </span>
          </div>

          {isAdmin && (
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white">
              <Sparkles className="w-3 h-3 text-crimson-400" />
              <span>Administrador</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing((prev) => !prev)}
            className="w-full rounded-xl text-xs font-bold py-2 flex items-center justify-center space-x-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Fechar Edição de Perfil' : 'Editar Nome, Telefone e CEP'}</span>
          </Button>
        </div>
      </div>

      {/* Formulário de Edição de Perfil */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 animate-fadeIn">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Editar Dados do Perfil
          </h4>

          <Input
            label="Nome Completo"
            placeholder="Seu nome completo"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Celular"
            placeholder="(12) 98765-4321"
            value={phoneInput}
            onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
          />

          <div>
            <Input
              label="CEP Residencial"
              placeholder="12246-021"
              value={cepInput}
              onChange={handleCepEditChange}
              leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
              required
            />
            {loadingCep && (
              <p className="text-[10px] text-gray-400 mt-1">Consultando endereço pelo CEP...</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Bairro"
              value={bairroInput}
              onChange={(e) => setBairroInput(e.target.value)}
              required
            />
            <Input
              label="Cidade"
              value={cidadeInput}
              onChange={(e) => setCidadeInput(e.target.value)}
              required
            />
          </div>

          <div className="flex space-x-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-xl text-xs font-semibold py-2.5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingProfile}
              className="flex-1 rounded-xl text-xs font-bold py-2.5 flex items-center justify-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </form>
      )}

      {/* Regras Reais de Verificação */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Nível de Cidadania & Antifraude
          </h4>
          <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Auditado
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className={`p-3 rounded-xl border transition-all ${!isNivel2 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800">Nível 1 (Básico)</span>
              {!isNivel2 && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Conta cadastrada com CEP. Permite navegar no feed, apoiar chamados (+1) e publicar zeladorias urbanas.
            </p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${isNivel2 ? 'bg-crimson-50 border-crimson-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800">Nível 2 (Cidadão Verificado)</span>
              {isNivel2 && <CheckCircle2 className="w-4 h-4 text-crimson-600" />}
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Validado pela moderação/residência. Libera voto auditado nas pautas da Câmara e petições oficiais.
            </p>
          </div>
        </div>

        {!isNivel2 && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            Sua conta está aguardando validação de residência para liberar votos em decisões da Câmara.
          </p>
        )}
      </div>

      {/* Estatísticas reais */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
          <p className="text-base font-black text-gray-900">{zeladoriaCount}</p>
          <p className="text-[10px] text-gray-500 font-medium">Zeladorias Criadas</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
          <p className="text-base font-black text-crimson-600">{votosCount}</p>
          <p className="text-[10px] text-gray-500 font-medium">Votos em Pautas</p>
        </div>
      </div>

      {/* Acesso ao Painel Admin (exibido somente para role === 'admin') */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-crimson-50 to-rose-50 border border-crimson-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-crimson-600" />
              <h4 className="text-xs font-black text-gray-900">
                Modo Administrador & IA
              </h4>
            </div>
            <span className="text-[10px] bg-crimson-600 text-white font-bold px-2 py-0.5 rounded-full">
              Gestor
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-snug">
            Gere pautas com IA a partir do Diário Oficial, modere petições e valide cidadãos Nível 2.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/admin')}
            className="w-full rounded-xl py-2.5 font-bold text-xs bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn flex items-center justify-center space-x-1.5"
          >
            <span>Abrir Painel de Moderação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

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
