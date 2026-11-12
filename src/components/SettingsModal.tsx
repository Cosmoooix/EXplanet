import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  X,
  Volume2,
  VolumeX,
  Download,
  Upload,
  RotateCcw,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🧑‍🚀', '🧙‍♂️', '🧝', '🥷', '🤖', '🦊', '🦉', '🧑‍🔬', '👸', '🤴'];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    player,
    updateUsername,
    updateAvatarBase,
    soundEnabled,
    toggleSound,
    resetProgress,
    exportSaveData,
    importSaveData,
  } = useGame();

  const [usernameInput, setUsernameInput] = useState<string>(player.username);
  const [importJson, setImportJson] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      updateUsername(usernameInput);
      setStatusMessage('Scholar name updated successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleExport = () => {
    const jsonStr = exportSaveData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explanet_save_${player.username.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Save backup downloaded!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = importSaveData(importJson);
    if (ok) {
      setStatusMessage('Progress loaded successfully!');
      setImportJson('');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1500);
    } else {
      setStatusMessage('Failed to parse save file. Invalid format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="cosmic-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white font-cinzel">Explorer Terminal Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 bg-purple-950/60 border border-purple-500/50 rounded-xl text-purple-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Profile Settings */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Scholar Username</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                maxLength={20}
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Base Avatar Sprite</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map(av => (
                <button
                  type="button"
                  key={av}
                  onClick={() => updateAvatarBase(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    player.avatarBase === av
                      ? 'bg-purple-600 ring-2 ring-purple-400 scale-110 shadow-lg'
                      : 'bg-slate-900 border border-white/5 hover:bg-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Audio Synthesis Settings */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Synthesizer Sound FX</h4>
            <p className="text-xs text-slate-400">Pure Web Audio procedural chimes & combat audio.</p>
          </div>
          <button
            onClick={toggleSound}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border border-white/10 text-slate-500'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio Enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Muted</span>
              </>
            )}
          </button>
        </div>

        {/* Data Backup & Cloud Transfer */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Save Data Management</h4>
            <p className="text-xs text-slate-400">
              Download your current academic progression or import a save backup file.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Save JSON</span>
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Paste backup save JSON text here to restore..."
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono"
            />
            {importJson.trim().length > 0 && (
              <button
                onClick={handleImport}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load Imported Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Danger Zone: Reset Progress */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 font-semibold text-center hover:underline"
            >
              Reset All Progress & Stats...
            </button>
          ) : (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl space-y-2">
              <p className="text-xs text-rose-200 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Are you sure? This erases all XP, level, coins, and cosmetics permanently!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={resetProgress}
                  className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Yes, Wipe Everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
