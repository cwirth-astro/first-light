import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="clock">
      <time className="clock__time" dateTime={now.toISOString()}>
        {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </time>
      <div className="clock__date">
        {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </header>
  );
}
