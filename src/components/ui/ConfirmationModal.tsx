'use client'

import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'warning',
}) => {
  const styles = {
    danger: {
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonVariant: 'danger' as const,
    },
    warning: {
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonVariant: 'secondary' as const,
    },
    info: {
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonVariant: 'primary' as const,
    },
  }[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div
        className={`flex items-start space-x-4 ${styles.bgColor} ${styles.borderColor} border rounded-lg p-4 mb-6`}
      >
        <AlertTriangle className={`h-8 w-8 ${styles.iconColor} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <p className="text-base text-gray-700 break-words">{message}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={styles.buttonVariant}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmationModal
