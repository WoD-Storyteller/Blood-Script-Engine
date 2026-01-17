import { useState, useEffect, useRef } from 'react';
import {
  fetchNpcs,
  batchImportNpcs,
  updateNpc,
  requestNpcPortraitUrl,
  saveNpcPortrait,
  getNpcTemplate,
  NpcData,
} from '../api';

type Props = {
  isST: boolean;
};

export default function NpcManager({ isST }: Props) {
  const [npcs, setNpcs] = useState<NpcData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNpc, setSelectedNpc] = useState<NpcData | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNpcs();
  }, []);

  const loadNpcs = async () => {
    try {
      const data = await fetchNpcs();
      setNpcs(data);
    } catch (e) {
      console.error('Failed to load NPCs:', e);
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const npcsToImport = parsed.npcs || parsed;
      
      if (!Array.isArray(npcsToImport)) {
        setImportResult({ success: false, message: 'Invalid format: expected { npcs: [...] } or [...]' });
        return;
      }

      const result = await batchImportNpcs(npcsToImport);
      setImportResult({
        success: result.errors === 0,
        message: `Imported ${result.imported} NPCs. ${result.errors > 0 ? `${result.errors} failed.` : ''}`,
      });
      
      if (result.imported > 0) {
        loadNpcs();
      }
    } catch (e) {
      setImportResult({ success: false, message: `Parse error: ${(e as Error).message}` });
    }
  };

  const downloadTemplate = async () => {
    try {
      const { template } = await getNpcTemplate();
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'npc-template.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download template:', e);
    }
  };

  const handlePortraitUpload = async (npc: NpcData, file: File) => {
    try {
      const { uploadURL, objectPath } = await requestNpcPortraitUrl(npc.npc_id, {
        name: file.name,
        size: file.size,
        contentType: file.type,
      });

      await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const result = await saveNpcPortrait(npc.npc_id, objectPath);
      
      setNpcs((prev) =>
        prev.map((n) =>
          n.npc_id === npc.npc_id ? { ...n, portrait_url: result.portraitUrl } : n
        )
      );

      if (selectedNpc?.npc_id === npc.npc_id) {
        setSelectedNpc({ ...selectedNpc, portrait_url: result.portraitUrl });
      }
    } catch (e) {
      console.error('Failed to upload portrait:', e);
    }
  };

  const handleWebhookUpdate = async (npcId: string, webhookUrl: string) => {
    try {
      await updateNpc(npcId, { webhook_url: webhookUrl || undefined });
      loadNpcs();
    } catch (e) {
      console.error('Failed to update webhook:', e);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading NPCs...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blood-crimson">NPC Management</h2>
        {isST && (
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="px-3 py-1 bg-blood-dark rounded hover:bg-blood-dark/70 text-sm"
            >
              Download Template
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="px-3 py-1 bg-blood-crimson rounded hover:bg-blood-red text-sm"
            >
              Import NPCs
            </button>
          </div>
        )}
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-blood-ash border border-blood-red/40 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold text-blood-crimson mb-4">Batch Import NPCs</h3>
            
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-blood-dark rounded hover:bg-blood-dark/70 text-sm"
              >
                Choose JSON File
              </button>
            </div>

            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"npcs": [{"name": "NPC Name", "role": "Primogen", ...}]}'
              className="w-full h-64 bg-blood-dark border border-blood-red/30 rounded p-3 text-sm font-mono"
            />

            {importResult && (
              <div className={`mt-2 p-2 rounded text-sm ${importResult.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                {importResult.message}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportJson('');
                  setImportResult(null);
                }}
                className="px-4 py-2 bg-blood-dark rounded"
              >
                Close
              </button>
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="px-4 py-2 bg-blood-crimson rounded hover:bg-blood-red disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {npcs.map((npc) => (
          <div
            key={npc.npc_id}
            className={`bg-blood-ash border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedNpc?.npc_id === npc.npc_id
                ? 'border-blood-crimson'
                : 'border-blood-dark hover:border-blood-red/50'
            }`}
            onClick={() => setSelectedNpc(npc)}
          >
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-blood-dark flex-shrink-0">
                {npc.portrait_url ? (
                  <img
                    src={npc.portrait_url}
                    alt={npc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-blood-crimson/50">
                    ?
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{npc.name}</h3>
                {npc.role && (
                  <p className="text-sm text-blood-crimson">{npc.role}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${npc.alive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-400">
                    Status: {npc.status || 0}
                  </span>
                  {npc.webhook_url && (
                    <span className="text-xs text-blue-400" title="Has voice webhook">
                      AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {npcs.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8">
            No NPCs yet. {isST && 'Use Import NPCs to add some!'}
          </div>
        )}
      </div>

      {selectedNpc && isST && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-blood-ash border border-blood-red/40 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-blood-crimson mb-4">
              Edit: {selectedNpc.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm mb-2">Portrait</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-blood-dark">
                  {selectedNpc.portrait_url ? (
                    <img
                      src={selectedNpc.portrait_url}
                      alt={selectedNpc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-blood-crimson/50">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={portraitInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePortraitUpload(selectedNpc, file);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => portraitInputRef.current?.click()}
                    className="px-3 py-1 bg-blood-dark rounded hover:bg-blood-dark/70 text-sm"
                  >
                    Upload Portrait
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">Voice Webhook (Tupperbox-style)</label>
              <input
                type="text"
                defaultValue={selectedNpc.webhook_url || ''}
                onBlur={(e) => handleWebhookUpdate(selectedNpc.npc_id, e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-blood-dark border border-blood-red/30 rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste a Discord webhook URL for AI to speak as this NPC
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">Personality</label>
              <div className="text-sm text-gray-300 bg-blood-dark/50 rounded p-2">
                {selectedNpc.personality?.traits?.length ? (
                  <>
                    <p><strong>Traits:</strong> {selectedNpc.personality.traits.join(', ')}</p>
                    {selectedNpc.personality.voice && (
                      <p><strong>Voice:</strong> {selectedNpc.personality.voice}</p>
                    )}
                    {selectedNpc.personality.goals?.length && (
                      <p><strong>Goals:</strong> {selectedNpc.personality.goals.join('; ')}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">No personality data</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNpc(null)}
                className="px-4 py-2 bg-blood-dark rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
