import { PortraitUploader } from '../ObjectUploader';
import { saveCharacterPortrait } from '../../api';

interface Props {
  sheet: any;
  characterId?: string;
  onChange?: (s: any) => void;
  onPortraitChange?: (url: string) => void;
}

export default function V5IdentityBlock({ sheet, characterId, onChange, onPortraitChange }: Props) {
  const handlePortraitUpload = async (objectPath: string) => {
    if (!characterId) return;
    try {
      const result = await saveCharacterPortrait(characterId, objectPath);
      if (result.success && onPortraitChange) {
        onPortraitChange(result.portraitUrl);
      }
    } catch (err) {
      console.error('Failed to save portrait:', err);
    }
  };

  return (
    <div className="bg-blood-ash/40 rounded p-3">
      <div className="text-blood-crimson text-sm font-semibold mb-2">Identity</div>
      <div className="flex gap-4">
        <PortraitUploader
          currentPortrait={sheet?.portrait_url}
          onUploadComplete={handlePortraitUpload}
          disabled={!characterId}
        />
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blood-gold/60">Name:</span>
              <span className="text-blood-bone ml-1">{sheet?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-blood-gold/60">Clan:</span>
              <span className="text-blood-bone ml-1">{sheet?.clan || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-blood-gold/60">Predator Type:</span>
              <span className="text-blood-bone ml-1">{sheet?.predator_type || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-blood-gold/60">Generation:</span>
              <span className="text-blood-bone ml-1">{sheet?.generation || '?'}</span>
            </div>
          </div>
          {sheet?.ambition && (
            <div className="mt-2 text-sm">
              <span className="text-blood-gold/60">Ambition:</span>
              <span className="text-blood-bone ml-1">{sheet.ambition}</span>
            </div>
          )}
          {sheet?.desire && (
            <div className="text-sm">
              <span className="text-blood-gold/60">Desire:</span>
              <span className="text-blood-bone ml-1">{sheet.desire}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
