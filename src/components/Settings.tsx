import { Session } from "../lib/types";

type Props = {
  courts: number;
  allowSoftOverride: boolean;
  onCourtsChange: (n: number) => void;
  onToggleOverride: (v: boolean) => void;
};

export default function Settings({
  courts,
  allowSoftOverride,
  onCourtsChange,
  onToggleOverride,
}: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Settings</h2>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <label className="flex flex-col text-sm">
          Courts
          <input
            type="number"
            min={1}
            value={courts}
            onChange={(e) =>
              onCourtsChange(Math.max(1, Number(e.target.value) || 1))
            }
            className="mt-1 w-28 rounded-md border px-3 py-2"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={allowSoftOverride}
            onChange={(e) => onToggleOverride(e.target.checked)}
          />
          Allow soft override when blocked
        </label>
        <div className="text-xs text-gray-500">
          {"Teammate <= 2, Opponent <= 2 repeats"}
        </div>
      </div>
    </div>
  );
}
