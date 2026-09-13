export interface SpeedOption {
  label: string;
  wpm: number;
}

const ABSOLUTE_SPEED_OPTIONS_WPM = [150, 200, 250, 300, 350, 400, 450, 500];

export function speedOptionsFor(medianWpm: number | null): SpeedOption[] {
  if (medianWpm === null) {
    return ABSOLUTE_SPEED_OPTIONS_WPM.map((wpm) => ({
      label: `${wpm} wpm`,
      wpm,
    }));
  }
  return [
    { label: "Your pace", wpm: Math.round(medianWpm) },
    { label: "+10%", wpm: Math.round(medianWpm * 1.1) },
    { label: "+25%", wpm: Math.round(medianWpm * 1.25) },
    { label: "+50%", wpm: Math.round(medianWpm * 1.5) },
  ];
}

export function SpeedPicker({
  options,
  selectedWpm,
  isCustom,
  customValue,
  onSelectOption,
  onCustomChange,
}: {
  options: SpeedOption[];
  selectedWpm: number;
  isCustom: boolean;
  customValue: string;
  onSelectOption: (wpm: number) => void;
  onCustomChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Target speed</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelectOption(option.wpm)}
            aria-pressed={!isCustom && selectedWpm === option.wpm}
            className={`rounded border px-3 py-1.5 font-sans text-sm text-ink ${
              !isCustom && selectedWpm === option.wpm
                ? "border-signal"
                : "border-rule"
            }`}
          >
            {option.label}
          </button>
        ))}
        <input
          type="number"
          min={50}
          placeholder="Custom"
          value={customValue}
          onChange={(event) => onCustomChange(event.target.value)}
          className={`w-24 rounded border px-3 py-1.5 font-sans text-sm text-ink ${
            isCustom ? "border-signal" : "border-rule"
          }`}
        />
      </div>
    </div>
  );
}
