import { Background } from "./components/Background";
import { Clock } from "./components/Clock";
import { TelescopeCard } from "./components/TelescopeCard";

export function App() {
  return (
    <>
      <Background />
      <main className="layout">
        <Clock />
        <section className="telescopes">
          <TelescopeCard telescope="webb" />
          <TelescopeCard telescope="hubble" />
        </section>
        {/* Future widgets (to-do list, etc.) go here. */}
      </main>
    </>
  );
}
