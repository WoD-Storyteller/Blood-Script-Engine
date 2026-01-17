import { useState, useEffect } from 'react';
import { emitOverride } from '../../realtime';
import { fetchAiSettings, updateAiSettings, AiSettings } from '../../api';

type Props = {
  engineId: string;
};

export default function STOverridePanel({ engineId }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'overrides' | 'ai'>('overrides');
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !aiSettings) {
      fetchAiSettings().then(setAiSettings).catch(console.error);
    }
  }, [open, aiSettings]);

  const toggleAiSetting = async (key: keyof AiSettings) => {
    if (!aiSettings) return;
    setSaving(true);
    try {
      const newValue = !aiSettings[key];
      const result = await updateAiSettings({ [key]: newValue });
      setAiSettings(result.config);
    } catch (e) {
      console.error('Failed to update AI setting:', e);
    }
    setSaving(false);
  };

  const setAiTone = async (tone: string) => {
    if (!aiSettings) return;
    setSaving(true);
    try {
      const result = await updateAiSettings({ ai_tone: tone });
      setAiSettings(result.config);
    } catch (e) {
      console.error('Failed to update AI tone:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded bg-blood-crimson hover:bg-blood-red shadow-lg"
      >
        ST Controls
      </button>

      {open && (
        <div className="mt-2 bg-blood-ash border border-blood-red/40 rounded-xl p-4 w-80 shadow-2xl">
          <div className="flex gap-2 mb-3">
            <button
              className={`flex-1 px-2 py-1 rounded text-sm ${tab === 'overrides' ? 'bg-blood-crimson' : 'bg-blood-dark/50'}`}
              onClick={() => setTab('overrides')}
            >
              Overrides
            </button>
            <button
              className={`flex-1 px-2 py-1 rounded text-sm ${tab === 'ai' ? 'bg-blood-crimson' : 'bg-blood-dark/50'}`}
              onClick={() => setTab('ai')}
            >
              AI Settings
            </button>
          </div>

          {tab === 'overrides' && (
            <div className="space-y-2">
              <h4 className="text-blood-crimson mb-2 font-semibold text-sm">
                Visual Overrides
              </h4>
              <button
                className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70 text-sm"
                onClick={() => emitOverride(engineId, 'force_frenzy', {})}
              >
                Force Frenzy
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70 text-sm"
                onClick={() => emitOverride(engineId, 'force_messy', {})}
              >
                Force Messy Critical
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70 text-sm"
                onClick={() => emitOverride(engineId, 'force_bestial', {})}
              >
                Force Bestial Failure
              </button>
              <button
                className="w-full px-3 py-2 rounded bg-blood-dark hover:bg-blood-dark/70 text-sm"
                onClick={() => emitOverride(engineId, 'reset_overlays', {})}
              >
                Clear Effects
              </button>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-3">
              <h4 className="text-blood-crimson mb-2 font-semibold text-sm">
                AI Features
              </h4>

              {aiSettings ? (
                <>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">AI Enabled</span>
                    <button
                      onClick={() => toggleAiSetting('ai_enabled')}
                      disabled={saving}
                      className={`w-12 h-6 rounded-full transition-colors ${aiSettings.ai_enabled ? 'bg-blood-crimson' : 'bg-blood-dark'}`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${aiSettings.ai_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">AI Narration</span>
                    <button
                      onClick={() => toggleAiSetting('ai_narration')}
                      disabled={saving || !aiSettings.ai_enabled}
                      className={`w-12 h-6 rounded-full transition-colors ${aiSettings.ai_narration && aiSettings.ai_enabled ? 'bg-blood-crimson' : 'bg-blood-dark'} ${!aiSettings.ai_enabled ? 'opacity-50' : ''}`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${aiSettings.ai_narration ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">NPC Voicing</span>
                    <button
                      onClick={() => toggleAiSetting('ai_npc_voicing')}
                      disabled={saving || !aiSettings.ai_enabled}
                      className={`w-12 h-6 rounded-full transition-colors ${aiSettings.ai_npc_voicing && aiSettings.ai_enabled ? 'bg-blood-crimson' : 'bg-blood-dark'} ${!aiSettings.ai_enabled ? 'opacity-50' : ''}`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${aiSettings.ai_npc_voicing ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  <div className="pt-2 border-t border-blood-dark/50">
                    <label className="block text-sm mb-1">Narration Tone</label>
                    <select
                      value={aiSettings.ai_tone}
                      onChange={(e) => setAiTone(e.target.value)}
                      disabled={saving || !aiSettings.ai_enabled}
                      className="w-full bg-blood-dark text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="gothic_horror">Gothic Horror</option>
                      <option value="noir">Noir</option>
                      <option value="action">Action</option>
                      <option value="political">Political Intrigue</option>
                      <option value="cosmic_horror">Cosmic Horror</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">Loading...</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
