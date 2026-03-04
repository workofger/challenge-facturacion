/**
 * MultiFileUpload - Drop zone that accepts multiple XML and PDF files
 * Files are auto-paired by matching filenames
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileCode, FileText, X, AlertTriangle, Plus } from 'lucide-react';

interface UnpairedFile {
  file: File;
  type: 'xml' | 'pdf';
  baseName: string;
}

interface MultiFileUploadProps {
  onFilesAdded: (files: File[]) => void;
  unpairedFiles: UnpairedFile[];
  onRemoveUnpaired: (baseName: string, type: 'xml' | 'pdf') => void;
  disabled?: boolean;
  totalEntries: number;
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onFilesAdded,
  unpairedFiles,
  onRemoveUnpaired,
  disabled = false,
  totalEntries,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'xml' || ext === 'pdf';
    });

    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input so same files can be selected again
      e.target.value = '';
    }
  }, [handleFiles]);

  const openFilePicker = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="section-header">
        <span className="section-icon">
          <Upload size={18} />
        </span>
        <h3 className="section-title">
          Carga de Facturas
          {totalEntries > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({totalEntries} {totalEntries === 1 ? 'factura' : 'facturas'} en cola)
            </span>
          )}
        </h3>
      </div>

      {/* Drop Zone */}
      <div className="card p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          className={`
            relative flex flex-col items-center justify-center w-full min-h-[180px] p-8
            border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : isDragging
                ? 'border-tf-yellow bg-tf-yellow/10 scale-[1.01] shadow-lg shadow-tf-yellow/10'
                : 'border-gray-200 hover:border-tf-yellow/50 bg-gray-50/50 hover:bg-tf-yellow/5'
            }
          `}
        >
          {/* Center Content */}
          <div className={`
            p-5 rounded-2xl mb-4 transition-all duration-300
            ${isDragging
              ? 'bg-tf-yellow/20 scale-110'
              : 'bg-white shadow-sm border border-gray-100'
            }
          `}>
            {totalEntries > 0 ? (
              <Plus size={36} className={isDragging ? 'text-tf-yellow' : 'text-tf-yellow-dark'} />
            ) : (
              <Upload size={36} className={isDragging ? 'text-tf-yellow' : 'text-gray-400'} />
            )}
          </div>

          {isDragging ? (
            <div className="text-center">
              <p className="text-lg font-semibold text-tf-yellow-dark">
                Suelta tus archivos aquí
              </p>
              <p className="text-sm text-tf-yellow-dark/70 mt-1">
                Se emparejarán XML y PDF automáticamente
              </p>
            </div>
          ) : totalEntries > 0 ? (
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">
                Agregar más facturas
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Arrastra o haz clic para agregar más archivos XML y PDF
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">
                Arrastra tus archivos XML y PDF aquí
              </p>
              <p className="text-sm text-gray-400 mt-2">
                o haz clic para seleccionar archivos
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                  <FileCode size={14} className="text-blue-500" />
                  <span>XML</span>
                </div>
                <span className="text-gray-300">+</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                  <FileText size={14} className="text-red-500" />
                  <span>PDF</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-3">
                Los archivos se emparejan automáticamente por nombre
              </p>
            </div>
          )}
        </div>

        {/* Unpaired Files Warning */}
        {unpairedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <AlertTriangle size={16} />
              <span>Archivos sin emparejar:</span>
            </div>
            {unpairedFiles.map((item, idx) => (
              <div
                key={`${item.baseName}-${item.type}-${idx}`}
                className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.type === 'xml' ? (
                    <FileCode size={16} className="text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText size={16} className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-700 truncate">{item.file.name}</span>
                  <span className="text-amber-500 text-xs flex-shrink-0">
                    Falta {item.type === 'xml' ? 'PDF' : 'XML'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUnpaired(item.baseName, item.type);
                  }}
                  className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={14} className="text-amber-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiFileUpload;
