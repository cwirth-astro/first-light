import { ApodCaption, Background } from "./components/Background";
import { Clock } from "./components/Clock";
import { TelescopeCard } from "./components/TelescopeCard";
import { useApod } from "./hooks/useApod";

export function App() {
  const apod = useApod();

  return (
    <>
      <Background apod={apod} />
      <main className="layout">
        <Clock />
        <section className="telescopes">
          <TelescopeCard telescope="webb" />
          <TelescopeCard telescope="hubble" />
        </section>
        {/* Future widgets (to-do list, etc.) go here. */}
      </main>
      {apod && <ApodCaption apod={apod} />}
    </>
  );
}
