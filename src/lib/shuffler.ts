import { Match, MatchPair, Player, Round, Session, pairKey } from './types'

type CandidateGroup = {
  ids: string[]
  pairing: { pairA: MatchPair; pairB: MatchPair }
  penalty: number
}

function isBeginner(p: Player) {
  return p.level === 'beginner'
}

function isNonBeginner(p: Player) {
  return p.level === 'semi' || p.level === 'advance'
}

function isFemale(p: Player) {
  return p.gender === 'F'
}

function isMale(p: Player) {
  return p.gender === 'M'
}

function levelGroupValid(players: Player[]): boolean {
  const b = players.filter(isBeginner).length
  if (b === 0) return true
  if (b === 2) return players.filter(isNonBeginner).length === 2
  if (b === 4) return true
  return false
}

function genderGroupValid(players: Player[]): boolean {
  const f = players.filter(isFemale).length
  // Allowed compositions for 4 players:
  // - 0F (all male)
  // - 4F (all female)
  // - 2F + 2M (must be mixed pairs enforced at pairing stage)
  if (f === 0 || f === 4 || f === 2) return true
  return false
}

function allPairings([a, b, c, d]: string[]): MatchPair[] {
  return [
    [a, b],
    [a, c],
    [a, d],
  ]
}

function candidatePairings(ids: string[], playersById: Record<string, Player>): { pairA: MatchPair; pairB: MatchPair }[] {
  const [a, b, c, d] = ids
  const ps = ids.map((id) => playersById[id])
  const bset = new Set(ps.filter(isBeginner).map((p) => p.id))
  const nbset = new Set(ps.filter(isNonBeginner).map((p) => p.id))
  const twoBtwoNB = bset.size === 2 && nbset.size === 2
  const fset = new Set(ps.filter(isFemale).map((p) => p.id))
  const mset = new Set(ps.filter(isMale).map((p) => p.id))
  const twoFtwoM = fset.size === 2 && mset.size === 2

  const combos: { pairA: MatchPair; pairB: MatchPair }[] = [
    { pairA: [a, b], pairB: [c, d] },
    { pairA: [a, c], pairB: [b, d] },
    { pairA: [a, d], pairB: [b, c] },
  ]

  const filteredByLevel = twoBtwoNB
    ? combos.filter(({ pairA, pairB }) => {
        const okA = (bset.has(pairA[0]) && nbset.has(pairA[1])) || (bset.has(pairA[1]) && nbset.has(pairA[0]))
        const okB = (bset.has(pairB[0]) && nbset.has(pairB[1])) || (bset.has(pairB[1]) && nbset.has(pairB[0]))
        return okA && okB
      })
    : combos

  // If 2F2M, enforce mixed pairs: each pair must be F + M
  const filteredByGender = twoFtwoM
    ? filteredByLevel.filter(({ pairA, pairB }) => {
        const okA = (fset.has(pairA[0]) && mset.has(pairA[1])) || (fset.has(pairA[1]) && mset.has(pairA[0]))
        const okB = (fset.has(pairB[0]) && mset.has(pairB[1])) || (fset.has(pairB[1]) && mset.has(pairB[0]))
        return okA && okB
      })
    : filteredByLevel

  return filteredByGender
}

function pairingPenalty(
  pairing: { pairA: MatchPair; pairB: MatchPair },
  teammatePairs: Record<string, number>,
  opponentPairs: Record<string, number>,
  limits: { teammate: number; opponent: number },
): number | null {
  const { pairA, pairB } = pairing
  const tkA = pairKey(pairA[0], pairA[1])
  const tkB = pairKey(pairB[0], pairB[1])

  const tA = teammatePairs[tkA] ?? 0
  const tB = teammatePairs[tkB] ?? 0
  if (tA >= limits.teammate || tB >= limits.teammate) return null

  // opponent pairs are all cross combinations
  const oppPairs: [string, string][] = [
    [pairA[0], pairB[0]],
    [pairA[0], pairB[1]],
    [pairA[1], pairB[0]],
    [pairA[1], pairB[1]],
  ]
  let oppPenalty = 0
  for (const [x, y] of oppPairs) {
    const k = pairKey(x, y)
    const c = opponentPairs[k] ?? 0
    if (c >= limits.opponent) return null
    oppPenalty += c
  }

  // smaller penalty preferred
  return tA + tB + oppPenalty
}

function groupPenalty(
  ids: string[],
  playersById: Record<string, Player>,
  teammatePairs: Record<string, number>,
  opponentPairs: Record<string, number>,
  limits: { teammate: number; opponent: number },
): CandidateGroup | null {
  const pairings = candidatePairings(ids, playersById)
  let best: CandidateGroup | null = null
  for (const pairing of pairings) {
    const pen = pairingPenalty(pairing, teammatePairs, opponentPairs, limits)
    if (pen == null) continue
    if (!best || pen < best.penalty) {
      best = { ids, pairing, penalty: pen }
    }
  }
  return best
}

function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = []
  const n = arr.length
  if (k > n) return res
  const idx = Array.from({ length: k }, (_, i) => i)
  while (true) {
    res.push(idx.map((i) => arr[i]))
    let i = k - 1
    while (i >= 0 && idx[i] === n - k + i) i--
    if (i < 0) break
    idx[i]++
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1
  }
  return res
}

export function generateRound(session: Session): Session {
  const { players, rounds, teammatePairs, opponentPairs, settings } = session
  const roundIndex = rounds.length + 1
  const playersById = Object.fromEntries(players.map((p) => [p.id, p]))

  const remaining = [...players]
    .sort((a, b) => a.gamesPlayed - b.gamesPlayed || a.lastPlayedAt - b.lastPlayedAt)

  const groups: { ids: string[]; pairing: { pairA: MatchPair; pairB: MatchPair } }[] = []
  const used = new Set<string>()

  const targetMatches = settings.courts

  // mutable copies for simulation
  const tPairs = { ...teammatePairs }
  const oPairs = { ...opponentPairs }

  let softUsed = false
  for (let m = 0; m < targetMatches; m++) {
    const pool = remaining.filter((p) => !used.has(p.id))
    if (pool.length < 4) break
    // Trim pool to keep search fast but effective
    const poolSize = Math.min(pool.length, 16)
    const poolIds = pool.slice(0, poolSize).map((p) => p.id)

    let best: CandidateGroup | null = null
    const idsToPlayers = (ids: string[]) => ids.map((id) => playersById[id])
    for (const ids of combinations(poolIds, 4)) {
      const ps = idsToPlayers(ids)
      if (!levelGroupValid(ps)) continue
      if (!genderGroupValid(ps)) continue
      const cand = groupPenalty(ids, playersById, tPairs, oPairs, settings.repeatLimit)
      if (!cand) continue
      if (!best || cand.penalty < best.penalty) best = cand
      if (best && best.penalty === 0) break // early exit perfect match
    }

    if (!best) {
      if (session.settings.allowSoftOverride) {
        // retry with relaxed limits (+1) once for this pick
        const relaxed = { teammate: session.settings.repeatLimit.teammate + 1, opponent: session.settings.repeatLimit.opponent + 1 }
        for (const ids of combinations(poolIds, 4)) {
          const ps = idsToPlayers(ids)
          if (!levelGroupValid(ps)) continue
          if (!genderGroupValid(ps)) continue
          const cand = groupPenalty(ids, playersById, tPairs, oPairs, relaxed)
          if (!cand) continue
          if (!best || cand.penalty < best.penalty) best = cand
          if (best && best.penalty === 0) break
        }
        if (best) softUsed = true
      }
      if (!best) {
        // no valid group found; stop here, leave rest benched
        break
      }
    }

    // Before reserving, hard-enforce pairing constraints again (safety net)
    // by re-selecting the best allowed pairing under current temp counts.
    const allowed = candidatePairings(best.ids, playersById)
    const currentKey = (p: { pairA: MatchPair; pairB: MatchPair }) => {
      const a = pairKey(p.pairA[0], p.pairA[1])
      const b = pairKey(p.pairB[0], p.pairB[1])
      return [a, b].sort().join('||')
    }
    const bestKey = currentKey(best.pairing)
    const exists = allowed.some((p) => currentKey(p) === bestKey)
    if (!exists) {
      let repaired: { pairA: MatchPair; pairB: MatchPair } | null = null
      let bestPen = Infinity
      for (const opt of allowed) {
        const pen = pairingPenalty(opt, tPairs, oPairs, settings.repeatLimit)
        if (pen == null) continue
        if (pen < bestPen) {
          bestPen = pen
          repaired = opt
        }
      }
      if (repaired) {
        best.pairing = repaired
      } else if (session.settings.allowSoftOverride) {
        const relaxed = { teammate: settings.repeatLimit.teammate + 1, opponent: settings.repeatLimit.opponent + 1 }
        for (const opt of allowed) {
          const pen = pairingPenalty(opt, tPairs, oPairs, relaxed)
          if (pen == null) continue
          best.pairing = opt
          break
        }
      }
    }

    // Reserve players
    best.ids.forEach((id) => used.add(id))
    // Update temp pair counts to influence next picks
    const { pairA, pairB } = best.pairing
    const tkA = pairKey(pairA[0], pairA[1])
    const tkB = pairKey(pairB[0], pairB[1])
    tPairs[tkA] = (tPairs[tkA] ?? 0) + 1
    tPairs[tkB] = (tPairs[tkB] ?? 0) + 1
    for (const x of pairA) for (const y of pairB) {
      const k = pairKey(x, y)
      oPairs[k] = (oPairs[k] ?? 0) + 1
    }

    groups.push({ ids: best.ids, pairing: best.pairing })
  }

  const bench = remaining.filter((p) => !used.has(p.id)).map((p) => p.id)

  const matches: Match[] = groups.map((g, i) => ({
    court: i + 1,
    pairA: g.pairing.pairA,
    pairB: g.pairing.pairB,
  }))

  // Commit updates
  const nextTeammate = { ...teammatePairs }
  const nextOpponent = { ...opponentPairs }
  for (const m of matches) {
    const tkA = pairKey(m.pairA[0], m.pairA[1])
    const tkB = pairKey(m.pairB[0], m.pairB[1])
    nextTeammate[tkA] = (nextTeammate[tkA] ?? 0) + 1
    nextTeammate[tkB] = (nextTeammate[tkB] ?? 0) + 1
    for (const x of m.pairA) for (const y of m.pairB) {
      const k = pairKey(x, y)
      nextOpponent[k] = (nextOpponent[k] ?? 0) + 1
    }
  }

  const nextPlayers = players.map((p) => {
    if (used.has(p.id)) {
      return { ...p, gamesPlayed: p.gamesPlayed + 1, lastPlayedAt: roundIndex }
    }
    return p
  })

  const round: Round = {
    id: String(roundIndex),
    index: roundIndex,
    matches: matches.map((m, i) => ({ ...m, court: i + 1 })),
    bench,
    softOverrideUsed: softUsed || undefined,
  }

  return {
    players: nextPlayers,
    rounds: [...rounds, round],
    teammatePairs: nextTeammate,
    opponentPairs: nextOpponent,
    settings: { ...settings },
  }
}
