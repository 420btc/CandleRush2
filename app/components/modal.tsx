import * as React from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md p-4">
        <div className="relative bg-black/90 rounded-xl border-2 border-yellow-400 shadow-2xl">
          <button
            type="button"
            className="absolute top-3 right-3 text-yellow-400 hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}
