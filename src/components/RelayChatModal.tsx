import React, { useState, useEffect } from 'react';
import { RelayMessage, UserRole } from '../types';
import { api } from '../services/api';
import { X, Send, ShieldAlert, CheckCircle, Lock, AlertCircle } from 'lucide-react';

interface RelayChatModalProps {
  requestId: string;
  candidateId?: string; // e.g. D-014
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export const RelayChatModal: React.FC<RelayChatModalProps> = ({
  requestId,
  candidateId = 'D-014',
  userRole,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<RelayMessage[]>([]);
  const [presets, setPresets] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMessages = async () => {
    try {
      const data = await api.getRelayMessages(requestId);
      setMessages(data.messages);
      setPresets(data.structuredPresets);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, requestId]);

  const handleSend = async (textToSend: string, isStructured: boolean = false) => {
    if (!textToSend.trim()) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      await api.sendRelayMessage({
        requestId,
        senderRole: userRole,
        senderCandidateId: userRole === 'DONOR' ? candidateId : undefined,
        message: textToSend,
        isStructured
      });
      setInputText('');
      await loadMessages();

      // Trigger realistic clinical coordination auto-reply after 1.2s
      setTimeout(async () => {
        try {
          if (userRole === 'DONOR') {
            await api.sendRelayMessage({
              requestId,
              senderRole: 'HOSPITAL',
              message:
                'Transfusion Unit (Room 104) notified. Phlebotomy team is standing by for crossmatch screening upon arrival.',
              isStructured: true
            });
          } else {
            await api.sendRelayMessage({
              requestId,
              senderRole: 'DONOR',
              senderCandidateId: candidateId || 'D-014',
              message:
                'Acknowledged hospital instructions. Approaching East Gate transfusion reception now.',
              isStructured: true
            });
          }
          await loadMessages();
        } catch (e) {
          // ignore
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Prohibited contact information detected in relay message.');
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col h-[580px] border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
              SOS
            </div>
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <span>Relay Coordination</span>
                <span className="text-xs text-emerald-400 font-mono">
                  {candidateId ? `(Candidate ${candidateId})` : `(${requestId})`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Zero-PII Encrypted Masking Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-900">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Direct contact is disabled. Any telephone numbers, emails, or personal addresses are automatically detected and blocked.
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400">
              <Lock className="w-8 h-8 text-slate-300 mb-2" />
              <p>Relay channel established for emergency request {requestId}.</p>
              <p>Use structured preset updates below for fast response.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderRole === userRole;
              const isBlocked = msg.status === 'BLOCKED_PII';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1 flex items-center gap-1">
                    <span>{msg.senderCandidateId ? `Candidate ${msg.senderCandidateId}` : msg.senderRole}</span>
                    <span>·</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                      isBlocked
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : isMine
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {isBlocked ? (
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{msg.message}</span>
                      </div>
                    ) : (
                      <span>{msg.message}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Structured Presets */}
        <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {presets.slice(0, 4).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset, true)}
              className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md transition-colors shadow-2xs text-left"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="px-4 py-1.5 bg-red-100 text-red-800 text-[11px] border-t border-red-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend(inputText, false);
            }}
            placeholder="Type safe coordination message..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            onClick={() => handleSend(inputText, false)}
            disabled={loading || !inputText.trim()}
            className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
