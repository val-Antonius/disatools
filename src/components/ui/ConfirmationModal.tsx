'use client'

import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  isLoading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonVariant: 'danger' as const
        }
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonVariant: 'secondary' as const
        }
      case 'info':
        return {
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonVariant: 'primary' as const
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Modal isOpen={isOpen} onClose={onClose} overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="p-8 sm:p-10 bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className={`flex items-start space-x-4 p-4 rounded-xl border ${styles.bgColor} ${styles.borderColor} mb-6`}>
          <AlertTriangle className={`h-8 w-8 ${styles.iconColor} flex-shrink-0 mt-1`} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-base text-gray-700 break-words">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
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
      </div>
    </Modal>
  )
}

export default ConfirmationModal 