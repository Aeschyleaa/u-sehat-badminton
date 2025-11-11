import { useMemo, useState } from 'react'
import { Gender, Level, Player } from '../lib/types'
import { extractNames } from '../lib/parse'

type Props = {
  onAddMany: (players: Omit<Player, 'id' | 'gamesPlayed' | 'lastPlayedAt' | 'arrived'>[]) => void
}

export default function BulkAdd({ onAddMany }: Props) {
  const [text, setText] = useState('')
  const [gender, setGender] = useState<Gender>('M')
  const [level, setLevel] = useState<Level>('semi')

  const names = useMemo(() => extractNames(text), [text])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (names.length === 0) return
    const players = names.map((name) => ({ name, gender, level }))
    onAddMany(players)
    setText('')
  }

  return (
    <form onSubmit={submit} className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Bulk Add</h2>
      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col text-sm">
          Paste names (one per line or numbered)
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"1. Jordan\n2. Rafli\n3. Leonardus"}
            className="mt-1 rounded-md border px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col text-sm">
            Default gender
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="mt-1 rounded-md border px-3 py-2">
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Default level
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-1 rounded-md border px-3 py-2">
              <option value="beginner">Beginner</option>
              <option value="semi">Semi</option>
              <option value="advance">Advance</option>
            </select>
          </label>
          <div className="self-end text-sm text-gray-600">Parsed: {names.length}</div>
        </div>
        <div>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={names.length === 0}
          >
            Add {names.length > 0 ? `${names.length} player(s)` : 'players'}
          </button>
        </div>
      </div>
    </form>
  )
}

