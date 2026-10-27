'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DiscordarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (motivo: string) => void;
}

export const DiscordarModal: React.FC<DiscordarModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [motivo, setMotivo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    onSubmit(motivo);
    setMotivo('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-50 text-red-600 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Por que você discorda?</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Sua opinião ajudará a fundamentar um abaixo-assinado comunitário e será enviada diretamente ao gabinete do vereador proponente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              required
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: O aumento de tráfego vai prejudicar o acesso dos moradores e o comércio local..."
              className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none text-gray-800"
            />

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Confirmar Voto
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

