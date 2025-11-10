export type Gender = 'M' | 'F'
export type Level = 'beginner' | 'semi' | 'advance'

export type Player = {
  id: string
  name: string
  gender: Gender
  level: Level
  gamesPlayed: number
  lastPlayedAt: number
}

export type MatchPair = [string, string] // player ids

export type Match = {
  court: number
  pairA: MatchPair
  pairB: MatchPair
}

export type Round = {
  id: string
  index: number
  matches: Match[]
  bench: string[] // player ids
  softOverrideUsed?: boolean
}

export type Session = {
  players: Player[]
  rounds: Round[]
  teammatePairs: Record<string, number> // key: id1|id2 sorted
  opponentPairs: Record<string, number> // key: id1|id2 sorted
  settings: {
    courts: number
    repeatLimit: {
      teammate: number
      opponent: number
    }
    allowSoftOverride: boolean
  }
}

export function pairKey(a: string, b: string) {
  return [a, b].sort().join('|')
}
