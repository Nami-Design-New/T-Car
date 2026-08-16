'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUploadCloud } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export default function LicenseModal({
  open,
  onClose,
  onSubmit,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (!file) return;

    onSubmit(file);
  };

  const content = (
    <div
      className="modal_overlay"
      onClick={onClose}
    >
      <div
        className="selection_modal license_modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="modal_header">
          <h3>رخصة القيادة</h3>

       <button
          type="button"
          className="close_btn"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <FiX />
        </button>

        </div>

        {/* Body */}
        <div className="modal_body">

          <button
            type="button"
            className={`license_upload_area ${
              file ? 'has_file' : ''
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <FiUploadCloud />

            {file ? (
              <span className="file_name">
                {file.name}
              </span>
            ) : (
              <>
                <span>
                  اضغط هنا لرفع صورة رخصة القيادة
                </span>

                <small>
                  JPG أو PNG
                </small>
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
            disabled={!file}
            onClick={handleSubmit}
          >
            إرسال
          </button>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}