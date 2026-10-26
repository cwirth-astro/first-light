import { useEffect, useState } from "react";

const timeFormat = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" });

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Split off AM/PM so it can be set smaller than the digits.
  const parts = timeFormat.formatToParts(now);
  const period = parts.find((p) => p.type === "dayPeriod")?.value;
  const digits = parts
    .filter((p) => p.type !== "dayPeriod")
    .map((p) => p.value)
    .join("")
    .trim();

  return (
    <header className="clock">
      <time className="clock__time" dateTime={now.toISOString()}>
        {digits}
        {period && <span className="clock__period">{period}</span>}
      </time>
      <div className="clock__date">{dateFormat.format(now)}</div>
    </header>
  );
}
