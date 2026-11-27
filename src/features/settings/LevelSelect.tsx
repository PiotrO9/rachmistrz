import {
  LEVELS,
  getLevel,
  levelDescription,
  type Level,
  type Operation,
} from "../../domain";
import { Select } from "../../ui/Select";
function LevelMeter({ level }: { level: Level }) {
  return (
    <span className="levelMeter" aria-hidden="true">
      {LEVELS.map(({ value }) => (
        <span
          key={value}
          data-filled={value <= level}
          style={{ height: `${0.2 + value * 0.12}rem` }}
        />
      ))}
    </span>
  );
}
export function LevelSelect({
  operation,
  ...props
}: {
  id: string;
  operation: Operation;
  value: Level;
  onChange: (value: Level) => void;
  disabled?: boolean;
  label: string;
  fieldHelp?: string;
}) {
  return (
    <Select<Level>
      {...props}
      compact
      options={LEVELS.map((level) => ({
        value: level.value,
        label: level.name,
        description: levelDescription(operation, level.value),
        leading: (
          <span className="levelOptionNumber" aria-hidden="true">
            {level.value}
          </span>
        ),
        trailing: <LevelMeter level={level.value} />,
      }))}
      renderValue={(value) => (
        <span className="levelValue">
          <span className="levelNumber" aria-hidden="true">
            {value}
          </span>
          <span className="levelControlText">
            <span className="levelName">{getLevel(value).name}</span>
            <LevelMeter level={value} />
          </span>
          <span className="srOnly">
            Poziom {value} z {LEVELS.length}
          </span>
        </span>
      )}
    />
  );
}
