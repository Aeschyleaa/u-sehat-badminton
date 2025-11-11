import { useEffect, useMemo, useState } from "react";
import Settings from "./components/Settings";
import PlayerForm from "./components/PlayerForm";
import BulkAdd from "./components/BulkAdd";
import PlayerList from "./components/PlayerList";
import RoundHistory from "./components/RoundHistory";
import { Player, Session } from "./lib/types";
import { generateRound } from "./lib/shuffler";
import Swal from "sweetalert2";

let nextId = 1;
const STORAGE_KEY = "badminton_shuffler_v1";

export default function App() {
  const [session, setSession] = useState<Session>({
    players: [],
    rounds: [],
    teammatePairs: {},
    opponentPairs: {},
    settings: {
      courts: 2,
      repeatLimit: { teammate: 2, opponent: 2 },
      allowSoftOverride: false,
    },
  });

  // Secondary display helper to avoid odd fallback chars
  const displayNameOf = (id: string) =>
    session.players.find((p) => p.id === id)?.name || "-";

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Session = JSON.parse(raw);
        setSession(saved);
        const maxId = saved.players.reduce(
          (m, p) => Math.max(m, Number(p.id) || 0),
          0
        );
        if (maxId >= nextId) nextId = maxId + 1;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);

  const nameOf = (id: string) =>
    session.players.find((p) => p.id === id)?.name || "-";

  const addPlayer = (
    p: Omit<Player, "id" | "gamesPlayed" | "lastPlayedAt">
  ) => {
    setSession((s) => ({
      ...s,
      players: [
        ...s.players,
        { id: String(nextId++), gamesPlayed: 0, lastPlayedAt: 0, ...p },
      ],
    }));
  };

  const removePlayer = (id: string) => {
    setSession((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
      teammatePairs: Object.fromEntries(
        Object.entries(s.teammatePairs).filter(
          ([k]) => !k.split("|").includes(id)
        )
      ),
      opponentPairs: Object.fromEntries(
        Object.entries(s.opponentPairs).filter(
          ([k]) => !k.split("|").includes(id)
        )
      ),
    }));
  };

  const addMany = (
    items: Omit<Player, "id" | "gamesPlayed" | "lastPlayedAt">[]
  ) => {
    setSession((s) => ({
      ...s,
      players: [
        ...s.players,
        ...items.map((p) => ({
          id: String(nextId++),
          gamesPlayed: 0,
          lastPlayedAt: 0,
          ...p,
        })),
      ],
    }));
  };

  const canGenerate = session.players.length >= 4;

  const updatePlayer = (
    id: string,
    patch: Partial<Pick<Player, "gender" | "level">>
  ) => {
    setSession((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    const next = generateRound(session);
    setSession(next);
    const last = next.rounds[next.rounds.length - 1];
    if (!last || last.matches.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No valid matches",
        text: "Add players or adjust levels/settings to generate matches.",
      });
      return;
    }

    const html = `
      <div style="text-align:left">
        ${last.matches
          .map(
            (m) => `
              <div style=\"padding:8px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;\">
                <div style=\"font-size:12px;color:#6b7280;margin-bottom:4px;\">Court ${
                  m.court
                }</div>
                <div>${displayNameOf(m.pairA[0])} &amp; ${displayNameOf(
              m.pairA[1]
            )}</div>
                <div style=\"color:#6b7280;font-size:13px;\">vs</div>
                <div>${displayNameOf(m.pairB[0])} &amp; ${displayNameOf(
              m.pairB[1]
            )}</div>
              </div>
            `
          )
          .join("")}
        ${
          last.bench.length > 0
            ? `<div style=\"margin-top:6px;color:#374151;font-size:14px;\">Bench: ${last.bench
                .map(displayNameOf)
                .join(", ")}</div>`
            : ""
        }
        ${
          last.softOverrideUsed
            ? `<div style=\"margin-top:6px;font-size:12px;color:#92400e;background:#FFFBEB;border:1px solid #FDE68A;border-radius:4px;padding:4px 8px;display:inline-block;\">Soft override used</div>`
            : ""
        }
      </div>`;

    Swal.fire({
      title: `Round ${last.index}`,
      html,
      confirmButtonText: "OK",
    });
  };

  const blockedInfo = useMemo(() => {
    if (session.players.length < 4) return null;
    const probe = generateRound(session);
    const last = probe.rounds[probe.rounds.length - 1];
    const made = last?.matches.length ?? 0;
    return { made };
  }, [session]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Badminton Shuffler</h1>
        <p className="text-sm text-gray-600">
          Fair doubles scheduling with skill and repeat limits.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Settings
            courts={session.settings.courts}
            allowSoftOverride={session.settings.allowSoftOverride}
            onCourtsChange={(n) =>
              setSession((s) => ({
                ...s,
                settings: { ...s.settings, courts: n },
              }))
            }
            onToggleOverride={(v) =>
              setSession((s) => ({
                ...s,
                settings: { ...s.settings, allowSoftOverride: v },
              }))
            }
          />
          <PlayerForm onAdd={addPlayer} />
          <BulkAdd onAddMany={addMany} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Generate</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const res = await Swal.fire({
                      title: "Start new session?",
                      text: "Resets rounds and play counts. Keep players or full reset?",
                      icon: "question",
                      showDenyButton: true,
                      showCancelButton: true,
                      confirmButtonText: "New Session",
                      denyButtonText: "Full Reset",
                    });
                    if (res.isConfirmed) {
                      setSession((s) => ({
                        players: s.players.map((p) => ({
                          ...p,
                          gamesPlayed: 0,
                          lastPlayedAt: 0,
                        })),
                        rounds: [],
                        teammatePairs: {},
                        opponentPairs: {},
                        settings: { ...s.settings },
                      }));
                    } else if (res.isDenied) {
                      const fresh: Session = {
                        players: [],
                        rounds: [],
                        teammatePairs: {},
                        opponentPairs: {},
                        settings: {
                          courts: 2,
                          repeatLimit: { teammate: 2, opponent: 2 },
                          allowSoftOverride: false,
                        },
                      };
                      setSession(fresh);
                      try {
                        localStorage.removeItem(STORAGE_KEY);
                      } catch {}
                      nextId = 1;
                    }
                  }}
                  className="rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-50"
                >
                  New Session
                </button>
                <button
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-green-700"
                >
                  Generate Round
                </button>
              </div>
            </div>
            {blockedInfo && blockedInfo.made === 0 && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Not enough valid combinations under current limits. Add players
                or adjust levels.
              </div>
            )}
            <div className="mt-3 text-sm text-gray-600">
              Courts: {session.settings.courts} • Players: {session.players.length}
            </div>
          </div>

          <PlayerList
            players={session.players}
            onRemove={removePlayer}
            onUpdate={updatePlayer}
          />
        </div>
      </div>

      <div className="mt-4">
        <RoundHistory rounds={session.rounds} nameOf={displayNameOf} />
      </div>
    </div>
  );
}





