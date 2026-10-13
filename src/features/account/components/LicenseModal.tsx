'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiUploadCloud } from 'react-icons/fi';
import { Dialog } from '@/shared/ui/Dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function LicenseModal({ open, onClose, onSubmit, loading = false, error }: Props) {
  const t = useTranslations('account.license');
  const [file, setFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;

    await onSubmit(file);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="selection_modal license_modal"
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
    >
      <Dialog.Header className="modal_header">
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>

      <Dialog.Body className="modal_body">
        <button
          type="button"
          className={`license_upload_area ${file ? 'has_file' : ''}`}
          onClick={() => inputRef.current?.click()}
        >
          <FiUploadCloud />

          {file ? (
            <span className="file_name">{file.name}</span>
          ) : (
            <>
              <span>{t('uploadPrompt')}</span>

              <small>{t('fileTypes')}</small>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="primary_btn wide"
          disabled={!file || loading}
          aria-busy={loading}
          onClick={handleSubmit}
        >
          {t('submit')}
        </button>

        {error && (
          <p className="text-danger small mt-2 mb-0" role="alert">
            {error}
          </p>
        )}
      </Dialog.Body>
    </Dialog>
  );
}
