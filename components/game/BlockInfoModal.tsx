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
    fetch('https://api.blockchair.com/bitcoin/blocks?limit=10')
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
    let interval: NodeJS.Timeout;
    if (open) {
      setLoading(true);
      fetchBlocks();
      // El refresco automático puede causar problemas de datos, así que solo refrescamos manualmente ahora
      // interval = setInterval(fetchBlocks, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
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
          <div className="flex flex-col gap-2 w-full px-2 pb-4" style={{overflowY: 'auto'}}>
            {Array.isArray(blocks) && blocks.length > 0 ? blocks.map((block: any) => (
              <div
                key={block.id}
                className="rounded-md px-2 py-2 flex flex-col gap-2 shadow" style={{ background: '#FFD600', color: 'white', border: '1px solid #FFD600', fontSize: 13, minHeight: 0, margin: 0 }}
                style={{ background: '#FFD600', color: 'white', border: '1px solid #FFD600', fontSize: 13, minHeight: 0 }}
              >
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                  <span className="font-bold text-white">Altura:</span> <span className="font-mono text-black">{block.id}</span>
                  <span className="font-bold text-white">Hash:</span> <span className="break-all text-black font-mono">{block.hash}</span>
                  <span className="font-bold text-white">Fecha:</span> <span className="text-black">{block.time}</span>
                  <span className="font-bold text-white">Txs:</span> <span className="text-black">{block.transaction_count}</span>
                  <span className="font-bold text-white">Tamaño:</span> <span className="text-black">{block.size} bytes</span>
                  <span className="font-bold text-white">Reward:</span> <span className="text-black">{block.reward} sat</span>
                  <span className="font-bold text-white">Minero:</span> <span className="text-black">{block.miner}</span>
                  <span className="font-bold text-white">Nonce:</span> <span className="text-black">{block.nonce}</span>
                  <span className="font-bold text-white">Dificultad:</span> <span className="text-black">{block.difficulty}</span>
                  <span className="font-bold text-white">Merkle:</span> <span className="break-all text-black font-mono">{block.merkle_root}</span>
                  <span className="font-bold text-white">Versión:</span> <span className="text-black">{block.version}</span>
                  <span className="font-bold text-white">Bits:</span> <span className="text-black">{block.bits}</span>
                  <span className="font-bold text-white">Peso:</span> <span className="text-black">{block.weight}</span>
                  <span className="font-bold text-white">Fee:</span> <span className="text-black">{block.fee}</span>
                  {block.extra_data && <><span className="font-bold text-white">Extra:</span> <span className="break-all text-black">{block.extra_data}</span></>}
                  {block.signature && <><span className="font-bold text-white">Signature:</span> <span className="break-all text-black">{block.signature}</span></>}
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
