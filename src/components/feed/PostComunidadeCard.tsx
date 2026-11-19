'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Check, Megaphone, FileText, Trash2 } from 'lucide-react';
import { PostComunidade, Comentario } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';

interface PostComunidadeCardProps {
  post: PostComunidade & { user?: any };
}

export const PostComunidadeCard: React.FC<PostComunidadeCardProps> = ({ post }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(!!post.user_ja_curtiu);
  const [likesCount, setLikesCount] = useState(post.curtidas || 0);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  // Estado para "Também me afeta (+1)"
  const [apoiado, setApoiado] = useState(!!post.user_ja_apoiou);
  const [moradoresCount, setMoradoresCount] = useState(post.moradores_afetados || 1);
  const [isUpdatingApoio, setIsUpdatingApoio] = useState(false);

  // Comentários reais
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comentarios_count ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .select('*, user:perfis_publicos(nome_completo, avatar_url, nivel_verificacao)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setComments(data as unknown as Comentario[]);
        setCommentsCount(data.length);
      }
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      void loadComments();
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      alert('Entre na sua conta para comentar nas ocorrências do bairro.');
      router.push('/login?next=/feed');
      return;
    }
    const text = newComment.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          conteudo: text.slice(0, 600),
        })
        .select('*, user:perfis_publicos(nome_completo, avatar_url, nivel_verificacao)')
        .single();
      if (!error && data) {
        setComments((prev) => [...prev, data as unknown as Comentario]);
        setCommentsCount((prev) => prev + 1);
        setNewComment('');
        void queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else {
        alert(error?.message || 'Erro ao enviar comentário.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comentarios').delete().eq('id', commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  };

  const handleLike = async () => {
    if (!currentUser?.id) {
      alert('Entre na sua conta para curtir ocorrências do bairro.');
      router.push('/login?next=/feed');
      return;
    }
    if (isUpdatingLike) return;
    setIsUpdatingLike(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const { data, error } = await supabase.rpc('toggle_curtir_post', {
        p_post_id: post.id,
      });
      if (!error && data) {
        setLiked(Boolean(data.curtido));
        if (typeof data.curtidas === 'number') {
          setLikesCount(data.curtidas);
        }
        void queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch {
      setLiked(!nextLiked);
      setLikesCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
    } finally {
      setIsUpdatingLike(false);
    }
  };

  const handleToggleAfeta = async () => {
    if (!currentUser?.id) {
      router.push('/login?next=/feed');
      return;
    }

    if (isUpdatingApoio) return;
    setIsUpdatingApoio(true);

    const estadoAnterior = apoiado;
    const totalAnterior = moradoresCount;
    const novoEstado = !estadoAnterior;
    const novoTotal = novoEstado ? totalAnterior + 1 : Math.max(1, totalAnterior - 1);

    setApoiado(novoEstado);
    setMoradoresCount(novoTotal);

    try {
      const { data, error } = await supabase.rpc('toggle_apoiar_post', {
        p_post_id: post.id,
      });

      if (error) {
        setApoiado(estadoAnterior);
        setMoradoresCount(totalAnterior);
        console.warn('Falha ao registrar apoio:', error.message);
      } else if (data && typeof data.moradores_afetados === 'number') {
        setApoiado(Boolean(data.apoiado));
        setMoradoresCount(data.moradores_afetados);
        void queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch (err) {
      setApoiado(estadoAnterior);
      setMoradoresCount(totalAnterior);
      console.warn('Erro de rede ao sincronizar apoio:', err);
    } finally {
      setIsUpdatingApoio(false);
    }
  };

  // Imagem fidedigna de zeladoria urbana
  const fotoUrlRealista =
    post.foto_url && !post.foto_url.includes('photo-1515162816999')
      ? post.foto_url
      : 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80';

  // Dados do usuário
  const user = post.user;
  const nomeExibicao = user?.nome_completo || 'Morador(a)';
  const bairroExibicao = user?.bairro || post.bairro;
  const nivelVerificacao = user?.nivel_verificacao ?? 1;

  return (
    <article className="bg-white max-w-md mx-auto pb-4 border-b border-gray-100 transition-colors">
      {/* Header do Autor */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            <Image
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
              }
              alt={nomeExibicao}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {nomeExibicao}
              </span>
              <span className="text-xs font-semibold text-gray-900 leading-tight">
                (Morador(a) do {bairroExibicao})
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              {nivelVerificacao >= 2 && (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-crimson-600 text-white flex items-center justify-center text-[9px] font-black">
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  </span>
                  <span className="text-[10px] text-crimson-700 font-bold">Cidadão Verificado</span>
                </>
              )}
              {nivelVerificacao === 1 && (
                <span className="text-[10px] text-gray-500 font-medium">Cadastrado</span>
              )}
              {nivelVerificacao === 0 && (
                <span className="text-[10px] text-gray-400 font-medium">Visitante</span>
              )}
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 p-1" aria-label="Opções">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Foto do Problema de Zeladoria */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden">
        <Image
          src={fotoUrlRealista}
          alt="Problema de zeladoria reportado"
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 448px"
          priority
        />
        {/* Selo de Protocolo Oficial sobre a foto */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-sm border border-white/10">
          <FileText className="w-3 h-3 text-crimson-400" />
          <span>Protocolo 156: #{post.numero_protocolo}</span>
        </div>
      </div>

      {/* BANNER DE IMPACTO COLETIVO & ANTI-DUPLICAÇÃO: "Também me afeta (+1)" */}
      <div className="mx-3.5 mt-2.5 p-2.5 rounded-xl bg-crimson-50/70 border border-crimson-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crimson-600"></span>
          </span>
          <div>
            <span className="text-xs font-black text-slate-900 block leading-tight">
              {moradoresCount} {moradoresCount === 1 ? 'morador afetado' : 'moradores afetados'}
            </span>
            <span className="text-[10px] text-crimson-800 font-semibold">Prioridade coletiva na Prefeitura</span>
          </div>
        </div>

        <button
          onClick={handleToggleAfeta}
          disabled={isUpdatingApoio}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 ${
            apoiado
              ? 'bg-crimson-600 text-white hover:bg-crimson-700 shadow-crimson-btn'
              : 'bg-white text-slate-800 border border-slate-300 hover:border-crimson-500 hover:text-crimson-700'
          }`}
          title="Clique para somar seu apoio a este chamado e evitar chamados duplicados"
        >
          {apoiado ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Você apoiou (+1)</span>
            </>
          ) : (
            <>
              <Megaphone className="w-3.5 h-3.5 text-crimson-600" />
              <span>Também me afeta (+1)</span>
            </>
          )}
        </button>
      </div>

      {/* Barra de Interações (estilo Instagram) */}
      <div className="flex items-center justify-between px-3.5 pt-2 pb-1">
        <div className="flex items-center space-x-4 text-gray-900">
          <button
            onClick={handleLike}
            aria-label="Curtir"
            className={`transition-colors active:scale-125 ${liked ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}`}
          >
            <Heart className={`w-6 h-6 stroke-[1.8] ${liked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleToggleComments}
            aria-label="Comentar"
            className={`transition-colors cursor-pointer ${showComments ? 'text-crimson-600' : 'hover:text-gray-600'}`}
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </button>
          <button
            aria-label="Compartilhar"
            onClick={() => {
              const url = `https://connectabrasil.vercel.app/feed`;
              if (navigator.share) {
                void navigator.share({
                  title: `Zeladoria ${post.bairro} - ConectaBr`,
                  text: post.descricao,
                  url,
                }).catch(() => {});
              } else {
                void navigator.clipboard.writeText(`${post.descricao}\n${url}`);
                alert('Link copiado para compartilhar!');
              }
            }}
            className="hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5 -rotate-45 stroke-[1.8]" />
          </button>
        </div>

        <button aria-label="Salvar" className="text-gray-900 hover:text-gray-600 transition-colors">
          <Bookmark className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>

      {/* Descrição e Protocolo */}
      <div className="px-3.5 py-1 space-y-1.5 text-xs text-gray-900">
        <p className="leading-snug">
          {post.descricao}
        </p>

        {/* Hashtags dinâmicas */}
        <p className="text-[11px] text-crimson-800 font-semibold space-x-1.5">
          <span className="hover:underline cursor-pointer">#ZeladoriaUrbana</span>
          <span className="hover:underline cursor-pointer">#{bairroExibicao.toLowerCase().replace(/\s+/g, '')}</span>
          <span className="hover:underline cursor-pointer">#{post.categoria}</span>
        </p>

        {/* Contadores */}
        <div className="flex items-center space-x-3 pt-1 text-xs text-gray-500 font-medium">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 stroke-[2] fill-transparent" />
            <span>{likesCount} curtidas</span>
          </div>
          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center space-x-1 hover:text-crimson-600 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 stroke-[2]" />
            <span>{commentsCount} comentários</span>
          </button>
        </div>

        {/* Gaveta de Comentários Reais */}
        {showComments && (
          <div className="mt-2 pt-2.5 border-t border-gray-100 space-y-2.5 animate-fadeIn">
            {loadingComments ? (
              <p className="text-[11px] text-gray-400">Carregando comentários...</p>
            ) : comments.length === 0 ? (
              <p className="text-[11px] text-gray-400">Seja o primeiro morador a comentar esta ocorrência.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="bg-gray-50 rounded-xl p-2 text-xs flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-900">
                        {c.user?.nome_completo || 'Morador'}
                      </span>
                      <p className="text-gray-700 leading-snug">{c.conteudo}</p>
                    </div>
                    {currentUser?.id === c.user_id && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteComment(c.id)}
                        className="text-gray-400 hover:text-red-600 p-0.5 shrink-0"
                        title="Excluir comentário"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? 'Escreva um comentário...' : 'Entre para comentar'}
                className="flex-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-3 py-1.5 bg-crimson-600 hover:bg-crimson-700 disabled:opacity-40 text-white rounded-full text-xs font-bold cursor-pointer"
              >
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};
