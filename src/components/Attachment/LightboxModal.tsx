import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, Paperclip, Clipboard } from 'lucide-react';
import { Attachment } from '../../types/pms';

interface LightboxModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ attachment, onClose }) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFit, setIsFit] = useState<boolean>(true);

  if (!attachment) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 3));
    setIsFit(false);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.5));
    setIsFit(false);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setRotation(0);
    setIsFit(true);
  };

  const isImage = attachment.mime_type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment.file_name);

  return (
    <div
      id="lightbox-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono"
      onClick={onClose}
    >
      <div
        id="lightbox-container"
        className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-white border-2 border-black overflow-hidden shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div
          id="lightbox-header"
          className="flex items-center justify-between px-5 py-3 bg-[#F5F5F5] border-b-2 border-black text-black"
        >
          <div className="flex items-center gap-3 min-w-0">
            {attachment.is_clipboard ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold bg-black text-white border border-black uppercase">
                <Clipboard className="w-3.5 h-3.5" strokeWidth={1.5} /> CLIPBOARD
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono bg-white text-black border border-black uppercase">
                <Paperclip className="w-3.5 h-3.5" strokeWidth={1.5} /> ATTACHMENT
              </span>
            )}
            <span className="text-xs font-bold truncate text-black max-w-md uppercase">
              {attachment.file_name}
            </span>
            <span className="text-xs text-[#525252]">
              [{(attachment.file_size / 1024 / 1024).toFixed(2)} MB]
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isImage && (
              <>
                <button
                  id="btn-lightbox-zoom-out"
                  onClick={handleZoomOut}
                  className="p-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors"
                  title="ZOOM OUT"
                >
                  <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <span className="text-xs font-mono px-1.5 text-black font-bold select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  id="btn-lightbox-zoom-in"
                  onClick={handleZoomIn}
                  className="p-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors"
                  title="ZOOM IN"
                >
                  <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  id="btn-lightbox-rotate"
                  onClick={handleRotate}
                  className="p-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors"
                  title="ROTATE 90°"
                >
                  <RotateCw className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  id="btn-lightbox-reset"
                  onClick={handleReset}
                  className="p-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors"
                  title="RESET"
                >
                  {isFit ? <Maximize2 className="w-4 h-4" strokeWidth={1.5} /> : <Minimize2 className="w-4 h-4" strokeWidth={1.5} />}
                </button>
                <div className="w-px h-5 bg-black mx-1" />
              </>
            )}

            <a
              id="btn-lightbox-download"
              href={attachment.file_url}
              download={attachment.file_name}
              target="_blank"
              rel="noreferrer"
              className="btn-mono-primary inline-flex items-center gap-1.5 text-xs"
              title="DOWNLOAD FILE"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> DOWNLOAD
            </a>

            <button
              id="btn-lightbox-close"
              onClick={onClose}
              className="p-1.5 ml-1 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
              title="CLOSE"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div
          id="lightbox-body"
          className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-[#F5F5F5] relative border-b-2 border-black"
        >
          {isImage ? (
            <div
              className="transition-transform duration-100 select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={attachment.file_url}
                alt={attachment.file_name}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full object-contain border-2 border-black pointer-events-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-black">
              <div className="w-16 h-16 mb-4 border-2 border-black bg-white flex items-center justify-center text-black">
                <Paperclip className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-black mb-1 uppercase font-mono">{attachment.file_name}</h3>
              <p className="text-xs text-[#525252] mb-6 font-mono">
                ENGINEERING DOCUMENT ({attachment.mime_type}) VIA S3 STORAGE
              </p>
              <a
                href={attachment.file_url}
                download={attachment.file_name}
                target="_blank"
                rel="noreferrer"
                className="btn-mono-primary inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} /> DOWNLOAD ORIGINAL FILE
              </a>
            </div>
          )}
        </div>

        {/* Footer Metadata */}
        <div
          id="lightbox-footer"
          className="flex items-center justify-between px-6 py-2.5 bg-white text-xs font-mono text-black"
        >
          <div className="flex items-center gap-4">
            <span>UPLOADER: <strong>{attachment.uploader_name || 'FIELD ENGINEER'}</strong></span>
            <span>TIME: {new Date(attachment.created_at).toLocaleString()}</span>
          </div>
          <div className="text-[#525252]">
            USE MOUSE WHEEL OR CONTROLS TO ZOOM & INSPECT
          </div>
        </div>
      </div>
    </div>
  );
};
