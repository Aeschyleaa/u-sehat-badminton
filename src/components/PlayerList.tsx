import { Player } from '../lib/types'

type Props = {
  players: Player[]
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<Player, 'gender' | 'level' | 'arrived' | 'partyId'>>) => void
}

export default function PlayerList({ players, onRemove, onUpdate }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Players ({players.length})</h2>
      {players.length === 0 ? (
        <div className="text-sm text-gray-500">No players yet. Add some to begin.</div>
      ) : (
        <ul className="divide-y">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium mr-2">{p.name}</span>
                <select
                  value={p.gender}
                  onChange={(e) => onUpdate(p.id, { gender: e.target.value as Player['gender'] })}
                  className="rounded-md border px-2 py-1 text-sm"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                <select
                  value={p.level}
                  onChange={(e) => onUpdate(p.id, { level: e.target.value as Player['level'] })}
                  className="rounded-md border px-2 py-1 text-sm capitalize"
                >
                  <option value="beginner">beginner</option>
                  <option value="semi">semi</option>
                  <option value="advance">advance</option>
                </select>
                <span className="text-xs text-gray-500">played {p.gamesPlayed}</span>
                <input
                  value={p.partyId ?? ''}
                  onChange={(e) => onUpdate(p.id, { partyId: e.target.value || null })}
                  placeholder="Group"
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{ width: 80 }}
                  title="Players with same group play same court"
                />
                <label className="inline-flex items-center gap-1 text-xs ml-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={!!p.arrived}
                    onChange={(e) => onUpdate(p.id, { arrived: e.target.checked })}
                  />
                  Arrived
                </label>
              </div>
              <button className="text-sm text-red-600 hover:underline" onClick={() => onRemove(p.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
