import { CharacterSummary } from '../../types'
import { CharacterCard } from './CharacterCard'

export function CharacterList({
  characters,
  activeId,
  onSelect,
}: {
  characters: CharacterSummary[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <aside className="bg-black border-r border-blood p-4 space-y-3 overflow-y-auto">
      <h2 className="text-blood text-lg font-semibold tracking-wide">
        Characters
      </h2>

      {characters.map(c => (
        <CharacterCard
          key={c.characterId}
          character={c}
          active={c.characterId === activeId}
          onClick={() => onSelect(c.characterId)}
        />
      ))}
    </aside>
  )
}
