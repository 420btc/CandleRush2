import { useState, useCallback } from 'react';

export default function useRouletteModal() {
  const [open, setOpen] = useState(false);
  const [lastPrize, setLastPrize] = useState<number | null>(null);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const handleWin = useCallback((prize: number) => {
    setLastPrize(prize);
    // Aquí podrías agregar lógica para actualizar el balance, mostrar toast, etc.
  }, []);

  return {
    open,
    openModal,
    closeModal,
    lastPrize,
    setLastPrize,
    handleWin,
  };
}
