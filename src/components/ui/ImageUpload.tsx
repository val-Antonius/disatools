'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Image as ImageIcon } from 'lucide-react'
import Button from './Button'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  label?: string
  className?: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  label = "Foto Item",
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Ukuran file maksimal 5MB')
      return
    }

    setIsUploading(true)
    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Gagal mengupload gambar')
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Gagal mengupload gambar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {value ? (
        <div className="relative">
          <Image
            src={value}
            alt="Item preview"
            width={400}
            height={192}
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!isUploading ? handleClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="space-y-2">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
            )}
            
            <div className="text-sm text-gray-600">
              {isUploading ? (
                'Mengupload...'
              ) : (
                <>
                  <span className="font-medium text-blue-600">Klik untuk upload</span> atau drag & drop
                  <br />
                  <span className="text-xs text-gray-500">PNG, JPG, GIF hingga 5MB</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
