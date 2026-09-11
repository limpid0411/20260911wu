import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Clipboard, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Attachment } from '../../types/pms';

interface ClipboardUploadHelperProps {
  targetType: 'TASK' | 'RFI' | 'COMMENT';
  targetId: string;
  onUploadSuccess: (attachment: Attachment) => void;
  compact?: boolean;
}

export const ClipboardUploadHelper: React.FC<ClipboardUploadHelperProps> = ({
  targetType,
  targetId,
  onUploadSuccess,
  compact = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global & scoped paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleProcessFile(file, true);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [targetId, targetType]);

  const handleProcessFile = async (file: File, isFromClipboard = false) => {
    // 50MB limit check
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert('檔案容量超過上限 50MB，請壓縮後重試！');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatus('正在請求 S3/MinIO Pre-signed 上傳授權網址...');

    try {
      // Step 1: Pre-signed URL
      const { uploadUrl, publicUrl } = storageService.getPresignedUrl(
        file.name || `clipboard_${Date.now()}.png`,
        file.type || 'image/png',
        file.size
      );

      // Step 2: Simulate Direct S3 Upload
      await new Promise((r) => setTimeout(r, 200));
      setUploadProgress(60);
      setUploadStatus('正透過 Pre-signed URL 直傳雲端物件儲存...');

      // Read as Data URL or Object URL for instant preview
      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });

      await new Promise((r) => setTimeout(r, 250));
      setUploadProgress(95);
      setUploadStatus('正在寫入後端附件資料庫 (confirm)...');

      // Step 3: Confirm with backend
      const newAttachment = storageService.confirmAttachment({
        target_type: targetType,
        target_id: targetId,
        file_name: file.name || `剪貼簿截圖_${new Date().toLocaleTimeString().replace(/:/g, '')}.png`,
        file_size: file.size,
        file_url: previewUrl || publicUrl,
        mime_type: file.type || 'image/png',
        is_clipboard: isFromClipboard
      });

      setUploadProgress(100);
      setUploadStatus('上傳成功！');
      onUploadSuccess(newAttachment);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setUploadStatus('上傳失敗');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0], false);
    }
  };

  // Demo shortcut: Simulate pressing Ctrl+V with a generated sample canvas drawing
  const handleSimulateClipboardPaste = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw simulated engineering diagram
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 450);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 450);
        ctx.stroke();
      }
      for (let y = 0; y < 450; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Structural drawings
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 100, 600, 250);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`現場實況紀錄截圖 - ${targetType} #${targetId.slice(-6)}`, 130, 160);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText(`時間戳記: ${new Date().toLocaleString()} (Ctrl+V 貼圖模擬)`, 130, 200);
      ctx.fillText(`管道碰撞高度差: ΔH = 180mm (S-204 vs M-301)`, 130, 235);

      // Red highlight box
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(130, 260, 400, 60);
      ctx.setLineDash([]);
      ctx.fillStyle = '#f87171';
      ctx.fillText('⚠️ 嚴重干擾點：穿樑主筋保護層干涉', 150, 300);

      canvas.toBlob((blob) => {
        if (blob) {
          const simulatedFile = new File([blob], `現場干擾截圖_${Date.now()}.png`, {
            type: 'image/png'
          });
          handleProcessFile(simulatedFile, true);
        }
      }, 'image/png');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0], false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-mono">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.dwg,.bim,.xlsx,.docx"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-mono-outline inline-flex items-center gap-1.5"
          title="UPLOAD ATTACHMENT (上傳檔案)"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : <UploadCloud className="w-3.5 h-3.5" strokeWidth={1.5} />}
          BROWSE (選擇檔案)
        </button>
        <button
          type="button"
          onClick={handleSimulateClipboardPaste}
          disabled={isUploading}
          className="btn-mono-primary inline-flex items-center gap-1.5"
          title="TEST CLIPBOARD PASTE (模擬剪貼簿貼圖)"
        >
          <Clipboard className="w-3.5 h-3.5" strokeWidth={1.5} />
          PASTE (Ctrl+V 貼圖)
        </button>
      </div>
    );
  }

  return (
    <div
      id="attachment-upload-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 p-4 transition-all font-mono ${
        isDragging
          ? 'border-black bg-[#F5F5F5]'
          : 'border-black border-dashed bg-white'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.dwg,.bim,.xlsx,.docx"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-black bg-black text-white flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-black uppercase">
                DRAG & DROP OR PRESS <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[#F5F5F5] border border-black">Ctrl + V</kbd> TO PASTE
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-black bg-white text-black">
                MAX 50MB
              </span>
            </div>
            <p className="text-xs text-[#525252] font-mono mt-0.5">
              FORMATS: PNG, JPG, WEBP, PDF, DWG, BIM, XLSX, DOCX (S3 / MINIO DIRECT)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-upload-file-browse"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-mono-outline inline-flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            BROWSE (瀏覽檔案)
          </button>

          <button
            type="button"
            id="btn-upload-paste-simulate"
            onClick={handleSimulateClipboardPaste}
            disabled={isUploading}
            className="btn-mono-primary inline-flex items-center justify-center gap-1.5"
          >
            <Clipboard className="w-3.5 h-3.5" strokeWidth={1.5} />
            PASTE (貼上剪貼簿)
          </button>
        </div>
      </div>

      {/* Uploading progress overlay */}
      {isUploading && (
        <div className="mt-3 pt-3 border-t-2 border-black">
          <div className="flex items-center justify-between text-xs text-black mb-1.5 font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
              {uploadStatus}
            </span>
            <span className="font-mono font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 border border-black bg-[#F5F5F5]">
            <div
              className="h-full bg-black transition-all duration-100"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
