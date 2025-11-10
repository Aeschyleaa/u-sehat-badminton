import { Round } from '../lib/types'

type Props = {
  rounds: Round[]
  nameOf: (id: string) => string
}

export default function RoundHistory({ rounds, nameOf }: Props) {
  if (rounds.length === 0) return null
  const ordered = [...rounds].reverse()
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">History</h2>
      <div className="space-y-4">
        {ordered.map((r) => (
          <div key={r.id} className="border rounded-md p-3">
            <div className="font-medium mb-2 flex items-center gap-2">
              <span>Round {r.index}</span>
              {r.softOverrideUsed && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">soft override</span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {r.matches.map((m) => (
                <div key={m.court} className="rounded border p-2">
                  <div className="text-xs text-gray-500 mb-1">Court {m.court}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div>{nameOf(m.pairA[0])} &amp; {nameOf(m.pairA[1])}</div>
                      <div className="text-gray-500 text-sm">vs</div>
                      <div>{nameOf(m.pairB[0])} &amp; {nameOf(m.pairB[1])}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {r.bench.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Bench: {r.bench.map(nameOf).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
