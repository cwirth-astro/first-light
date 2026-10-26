import type { Telescope } from "./api/telescopes";
import { Background, BackgroundCaption } from "./components/Background";
import { Clock } from "./components/Clock";
import { SettingsButton, SettingsPanel } from "./components/SettingsPanel";
import { TelescopeCard } from "./components/TelescopeCard";
import { TodoList } from "./components/TodoList";
import { useBackgroundImage } from "./hooks/useBackgroundImage";
import { useSettings } from "./settings";

const TELESCOPES: Telescope[] = ["webb", "hubble"];

export function App() {
  const [settings] = useSettings();
  const { image, next } = useBackgroundImage(settings.background);

  const telescopes = TELESCOPES.filter((t) => settings.telescopes[t]);

  return (
    <>
      <Background image={image} />
      <main className="home">
        <Clock />
        {settings.showTodos && <TodoList />}
        {telescopes.length > 0 && (
          <section className="scopes" aria-label="Live telescope observations">
            {telescopes.map((t) => (
              <TelescopeCard key={t} telescope={t} />
            ))}
          </section>
        )}
        <footer className="home__footer">
          {image && <BackgroundCaption image={image} onNext={next} />}
          <SettingsButton />
        </footer>
      </main>
      <SettingsPanel />
    </>
  );
}
