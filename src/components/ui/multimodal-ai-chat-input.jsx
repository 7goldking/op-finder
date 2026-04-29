import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X as XIcon, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from '@/components/ui/animated-state-icons';
import { integrations } from '@/api/integrations';

/**
 * Multimodal chat composer. Supports text + file attachments with upload.
 * Styled with the app's shadcn tokens (dark/light aware).
 *
 * Props:
 *  - value, onChange: controlled input text
 *  - attachments, setAttachments: [{ url, name, contentType, size }]
 *  - onSend({ input, attachments })
 *  - onStop()
 *  - isGenerating, canSend
 *  - suggestions?: string[]          — shown when input empty & no messages
 *  - showSuggestions?: boolean
 *  - placeholder?: string
 */
function PureMultimodalInput({
  value,
  onChange,
  attachments,
  setAttachments,
  onSend,
  onStop,
  isGenerating,
  canSend = true,
  suggestions = [],
  showSuggestions = false,
  placeholder = 'Send a message...',
  className,
  autoFocus = true,
  disabled = false,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight + 2}px`;
    }
  };

  const resetHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.rows = 1;
      adjustHeight();
    }
  }, []);

  useEffect(() => { adjustHeight(); }, [value]);

  const uploadFile = async (file) => {
    try {
      const { file_url } = await integrations.Core.UploadFile({ file });
      return {
        url: file_url,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      };
    } catch (e) {
      console.error('Upload failed', e);
      return undefined;
    } finally {
      setUploadQueue((q) => q.filter((n) => n !== file.name));
    }
  };

  const handleFileChange = useCallback(async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadQueue((q) => [...q, ...files.map((f) => f.name)]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const MAX = 25 * 1024 * 1024;
    const valid = files.filter((f) => f.size <= MAX);
    const invalid = files.filter((f) => f.size > MAX);
    if (invalid.length) {
      setUploadQueue((q) => q.filter((n) => !invalid.some((f) => f.name === n)));
    }

    const results = await Promise.all(valid.map(uploadFile));
    const ok = results.filter(Boolean);
    setAttachments((curr) => [...curr, ...ok]);
  }, [setAttachments]);

  const removeAttachment = useCallback((att) => {
    setAttachments((curr) => curr.filter((a) => a.url !== att.url || a.name !== att.name));
    textareaRef.current?.focus();
  }, [setAttachments]);

  const submit = useCallback(() => {
    if (!value?.trim() && attachments.length === 0) return;
    onSend({ input: value, attachments });
    resetHeight();
    textareaRef.current?.focus();
  }, [value, attachments, onSend, resetHeight]);

  const isDisabled = disabled || !canSend || isGenerating || uploadQueue.length > 0 ||
    ((value?.trim().length || 0) === 0 && attachments.length === 0);

  const attachDisabled = disabled || isGenerating || uploadQueue.length > 0;

  return (
    <div className={cn('relative w-full flex flex-col gap-3', className)}>
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            key="suggested"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid sm:grid-cols-2 gap-2"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { onChange(s); requestAnimationFrame(() => { adjustHeight(); textareaRef.current?.focus(); }); }}
                className={cn(
                  'text-left border rounded-xl px-4 py-3 text-sm border-border bg-card hover:bg-secondary transition-colors',
                  i > 1 && 'hidden sm:block'
                )}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        multiple
        tabIndex={-1}
        disabled={attachDisabled}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-3 overflow-x-auto pb-1 pt-1">
          {attachments.map((att) => (
            <div key={`${att.url}-${att.name}`} className="relative group shrink-0">
              <div className="w-20 h-16 rounded-md border border-border bg-secondary overflow-hidden flex items-center justify-center">
                {att.contentType?.startsWith('image/') ? (
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[10px] text-muted-foreground px-1 text-center break-all">
                    {att.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground max-w-20 truncate mt-1">{att.name}</div>
              <button
                type="button"
                onClick={() => removeAttachment(att)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${att.name}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          {uploadQueue.map((name) => (
            <div key={`q-${name}`} className="shrink-0">
              <div className="w-20 h-16 rounded-md border border-border bg-secondary flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
              <div className="text-[10px] text-muted-foreground max-w-20 truncate mt-1">{name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={1}
          autoFocus={autoFocus}
          disabled={disabled || isGenerating}
          className={cn(
            'min-h-[52px] max-h-[60vh] overflow-y-auto resize-none rounded-2xl bg-secondary border-transparent pl-12 pr-12 py-3.5 text-base md:text-sm focus-visible:ring-1 focus-visible:ring-ring'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!isDisabled) submit();
            }
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachDisabled}
          className="absolute left-2 bottom-2 h-9 w-9 rounded-full flex items-center justify-center hover:bg-background/60 text-muted-foreground disabled:opacity-40 transition-colors"
          aria-label="Attach files"
        >
          <Paperclip className="w-4 h-4 -rotate-45" />
        </button>

        <div className="absolute right-2 bottom-2">
          {isGenerating ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="h-9 w-9 rounded-full"
              aria-label="Stop generating"
            >
              <span className="w-3 h-3 bg-primary-foreground rounded-[2px]" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={submit}
              disabled={isDisabled}
              className="h-9 w-9 rounded-full"
              aria-label="Send message"
            >
              <SendIcon size={16} color="currentColor" active={false} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput, (prev, next) => {
  if (prev.value !== next.value) return false;
  if (prev.isGenerating !== next.isGenerating) return false;
  if (prev.canSend !== next.canSend) return false;
  if (prev.disabled !== next.disabled) return false;
  if (prev.showSuggestions !== next.showSuggestions) return false;
  if (prev.placeholder !== next.placeholder) return false;
  if (prev.attachments.length !== next.attachments.length) return false;
  if (!equal(prev.attachments, next.attachments)) return false;
  if (!equal(prev.suggestions, next.suggestions)) return false;
  return true;
});

export default MultimodalInput;