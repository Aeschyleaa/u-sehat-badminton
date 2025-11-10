import { useState } from 'react'
import { Gender, Level, Player } from '../lib/types'

type Props = {
  onAdd: (p: Omit<Player, 'id' | 'gamesPlayed' | 'lastPlayedAt'>) => void
}

export default function PlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('M')
  const [level, setLevel] = useState<Level>('semi')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), gender, level })
    setName('')
    setGender('M')
    setLevel('semi')
  }

  return (
    <form onSubmit={submit} className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Add Player</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="flex flex-col text-sm sm:col-span-2">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 rounded-md border px-3 py-2"
            placeholder="e.g., Rafli"
          />
        </label>
        <label className="flex flex-col text-sm">
          Gender
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="mt-1 rounded-md border px-3 py-2">
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Level
          <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-1 rounded-md border px-3 py-2">
            <option value="beginner">Beginner</option>
            <option value="semi">Semi</option>
            <option value="advance">Advance</option>
          </select>
        </label>
      </div>
      <div className="mt-3">
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add</button>
      </div>
    </form>
  )
}

