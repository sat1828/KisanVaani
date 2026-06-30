import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, uploadImage, ChatResponse } from '../utils/api';
import {
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlineTrash,
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { RiLeafLine } from 'react-icons/ri';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  diagnosis?: string | null;
  confidence?: number | null;
  treatment?: string | null;
  imageUrl?: string;
  degraded?: boolean;
  timestamp: Date;
}

const suggestions = [
  'Mere dhan ke patte pe kaale dhabbe pad rahe hain',
  'Aaj chhidkav kar sakte hain?',
  'Gehun ka kya bhav hai aaj?',
  'Mere tomato ke phal sadh rahe hain',
];

const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface DemoChatHandle {
  /** Sets the composer's text and focuses it, without sending. Used by
   *  the "Try Saying..." suggestions in Demo.tsx — replaces a previous
   *  implementation that mutated the textarea's DOM value directly and
   *  dispatched a synthetic event, which does NOT reliably update React
   *  controlled-input state (a well-known React/DOM gotcha), meaning
   *  clicking those buttons could show text on screen while the actual
   *  message sent was empty. */
  setInputText: (text: string) => void;
}

const DemoChat = forwardRef<DemoChatHandle>(function DemoChat(_props, ref) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: 'Namaste! 🙏 Main Krishak Mitra hoon. Apni fasal ki samasya batao — main turant madad karunga.\n\nKya samasya hai? Beemari, mausam, ya mandi bhav? Aap photo bhi bhej sakte hain. 📷',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Persists for the lifetime of this chat widget instance so the
  // backend's multi-turn session memory (see backend services/claude.ts)
  // actually has continuity across messages, instead of every message
  // being treated as a brand-new conversation.
  const [sessionId] = useState(() => crypto.randomUUID());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Revoke object URLs on unmount to avoid leaking memory.
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  useImperativeHandle(ref, () => ({
    setInputText: (text: string) => {
      setInput(text);
      // Defer focus to after the state update has flushed and the
      // textarea has had a chance to re-render with the new value.
      requestAnimationFrame(() => inputRef.current?.focus());
    },
  }), []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Sirf JPEG, PNG, ya WebP image allowed hai.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image bahut badi hai. Max ${MAX_IMAGE_SIZE_MB}MB allowed hai.`);
      return;
    }

    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removePendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setUploadError(null);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !pendingImage) || isLoading || isUploading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed || (pendingImage ? 'Is tasveer mein kya samasya hai?' : ''),
      imageUrl: pendingImage?.previewUrl,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (pendingImage) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
          const uploadResult = await uploadImage(pendingImage.file, setUploadProgress);
          imageUrl = uploadResult.url;
        } catch (uploadErr: any) {
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `Photo upload nahi ho payi: ${uploadErr.message}. Kripya text se apni samasya batayein.`,
              timestamp: new Date(),
            },
          ]);
          setIsUploading(false);
          setIsLoading(false);
          removePendingImage();
          return;
        }
        setIsUploading(false);
      }

      const res: ChatResponse = await sendChatMessage({
        message: userMessage.content,
        language: 'hi',
        farmerName: 'Kisan',
        sessionId,
        imageUrl,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.response,
        diagnosis: res.diagnosis,
        confidence: res.confidence,
        treatment: res.treatment,
        degraded: res.degraded,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      removePendingImage();
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Maaf karein, koi error aaya hai. Kripya dubara try karein.\n\nError: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: 'Voice input is not supported in your browser. Please use Chrome or Edge for voice support.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => {
        setInput(transcript);
        handleSend();
      }, 500);
    };

    recognition.start();
  };

  const clearChat = () => {
    removePendingImage();
    setMessages([
      {
        id: `intro-${Date.now()}`,
        role: 'assistant',
        content: 'Chat cleared. Namaste! 🙏 Main Krishak Mitra hoon. Kya samasya hai?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[600px] lg:h-[700px]">
      {/* Chat header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <RiLeafLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              Krishak Mitra
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {isLoading ? 'Thinking...' : 'Online'}
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-all"
          title="Clear chat"
          aria-label="Clear chat"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'glass text-gray-700 dark:text-gray-200'
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded crop photo"
                    className="rounded-lg mb-2 max-h-48 w-full object-cover"
                  />
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {msg.degraded && (
                  <div className="mt-2 pt-2 border-t border-amber-300/40 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <HiOutlineExclamation className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Yeh jawab offline/demo mode mein hai (live AI uplabdh nahi tha). Pakki diagnosis ke liye dobara try karein.</span>
                  </div>
                )}

                {msg.diagnosis && (
                  <div className={`mt-2 pt-2 border-t ${msg.role === 'user' ? 'border-white/20' : 'border-gray-200 dark:border-gray-600'}`}>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-medium">Diagnosis:</span>
                      <span>{msg.diagnosis}</span>
                      {msg.confidence != null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          msg.confidence > 0.8
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : msg.confidence > 0.5
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(isLoading || isUploading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl px-5 py-3.5">
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Photo upload ho rahi hai... {uploadProgress}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className="px-6 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(suggestion);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 px-4 py-2 rounded-xl glass text-xs text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 transition-all whitespace-nowrap border border-gray-200/50 dark:border-gray-700/50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-6 pb-2">
          <div className="relative inline-block">
            <img src={pendingImage.previewUrl} alt="Selected" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
            <button
              onClick={removePendingImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
              title="Remove photo"
              aria-label="Remove photo"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="px-6 pb-2 text-xs text-red-500">{uploadError}</div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Apni samasya yahan likhein..."
              rows={1}
              className="w-full px-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all min-h-[44px] max-h-[120px]"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl glass text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200"
            title="Attach photo"
            aria-label="Attach photo"
          >
            <HiOutlinePhotograph className="w-5 h-5" />
          </button>

          <button
            onClick={handleVoice}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
            }`}
            title="Voice input"
            aria-label="Voice input"
          >
            <HiOutlineMicrophone className="w-5 h-5" />
          </button>

          <button
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || isLoading || isUploading}
            className={`p-3 rounded-xl transition-all duration-200 ${
              (input.trim() || pendingImage) && !isLoading && !isUploading
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
                : 'glass text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <HiOutlinePaperAirplane className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default DemoChat;
