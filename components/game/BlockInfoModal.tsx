import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface Block {
  id: number;
  hash: string;
  time: string;
  transaction_count: number;
  size: number;
  reward: number;
  miner: string;
  version: number;
  bits: number;
  nonce: number;
  difficulty: number;
  merkle_root: string;
  extra_data: string;
  signature: string;
  weight: number;
  fee: number;
  // ...otros campos posibles
}

interface BlockInfoModalProps {
  open: boolean;
  onClose: () => void;
}

const BlockInfoModal: React.FC<BlockInfoModalProps> = ({ open, onClose }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permite refrescar manualmente
  const fetchBlocks = () => {
    setLoading(true);
    fetch('https://api.blockchair.com/bitcoin/blocks?limit=12')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setBlocks(data.data);
          setError(null);
        } else {
          setBlocks([]);
          setError('Datos de bloques no disponibles');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error al obtener datos de Blockchair');
        setBlocks([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchBlocks();
    }
    return () => {};
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black bg-opacity-90" style={{zIndex:9999}}>
      <div
        className="relative rounded-xl flex flex-col items-center z-[9999]"
        style={{
          background: '#111',
          border: '2px solid #FFD600',
          width: '90vw',
          maxWidth: 600,
          maxHeight: '90vh',
          padding: 0,
          overflowY: 'auto',
          zIndex: 9999,
        }}
      >
        <button
          className="absolute top-2 right-4 text-white text-2xl font-bold hover:text-yellow-400 z-10"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <button
          className="absolute top-2 right-14 text-xs font-bold bg-yellow-400 text-black rounded px-3 py-1 hover:bg-yellow-300 z-10 border border-yellow-600 shadow"
          onClick={fetchBlocks}
          aria-label="Actualizar bloques"
        >
          Actualizar
        </button>
        <h2 className="text-base font-extrabold text-white text-center w-full mb-2" style={{background:'#111cc',padding:'8px 0',borderRadius:8}}>
  Últimos 10 bloques minados de Bitcoin
</h2>
        {loading ? (
          <div className="text-white text-center">Cargando...</div>
        ) : error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-2 pb-4" style={{overflowY: 'auto'}}>
            {Array.isArray(blocks) && blocks.length > 0 ? blocks.map((block: any) => (
               <div
                 key={block.id}
                 className="rounded-lg flex flex-col items-center justify-center p-2 border-2 border-yellow-400 bg-gradient-to-br from-yellow-400/50 to-yellow-400/30 backdrop-blur-sm"
                 style={{
                   width: '150px',
                   height: '250px',
                   fontSize: '0.65rem',
                   position: 'relative',
                   overflow: 'hidden',
                   border: '2px solid #FFD600',
                   background: 'radial-gradient(circle at center, rgba(255,214,0,0.5) 0%, rgba(255,214,0,0.3) 100%)',
                   boxShadow: '0 6px 24px rgba(255,214,0,0.2)'
                 }}
               >
                 <div className="flex flex-col gap-1 w-full text-center">
                   <div className="font-bold text-white">#{block.id}</div>
                   <div className="grid grid-cols-2 gap-1 w-full">
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Hash:</span>
                       <span className="text-xs text-black font-mono break-all">{block.hash.slice(0, 8)}...</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Fecha:</span>
                       <span className="text-xs text-black">{block.time}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Txs:</span>
                       <span className="text-xs text-black">{block.transaction_count}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Tamaño:</span>
                       <span className="text-xs text-black">{block.size} bytes</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Reward:</span>
                       <span className="text-xs text-black">{block.reward} sat</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Minero:</span>
                       <span className="text-xs text-black">{block.miner}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Nonce:</span>
                       <span className="text-xs text-black">{block.nonce}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Dificultad:</span>
                       <span className="text-xs text-black">{block.difficulty}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Versión:</span>
                       <span className="text-xs text-black">{block.version}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Bits:</span>
                       <span className="text-xs text-black">{block.bits}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Peso:</span>
                       <span className="text-xs text-black">{block.weight}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="font-medium text-white">Fee:</span>
                       <span className="text-xs text-black">{block.fee}</span>
                     </div>
                   </div>
                 </div>
               </div>
             )) : (
               <div className="text-white text-center py-4">No hay datos de bloques disponibles.</div>
             )}
           </div>
         )}
       </div>
     </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default BlockInfoModal;
