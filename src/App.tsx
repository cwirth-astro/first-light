import type { Telescope } from "./api/telescopes";
import { Agenda } from "./components/Agenda";
import { Background, BackgroundCaption } from "./components/Background";
import { Clock } from "./components/Clock";
import { RubinCard } from "./components/RubinCard";
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
  const showAgenda = settings.showCalendar && settings.calendarUrls.length > 0;

  return (
    <>
      <Background image={image} />
      <main className="home">
        <Clock />
        {(showAgenda || settings.showTodos) && (
          <section className="panel today" aria-labelledby="today-title">
            <h2 id="today-title" className="today__title">
              Today
            </h2>
            <div className="today__body">
              {showAgenda && <Agenda feeds={settings.calendarUrls} />}
              {settings.showTodos && <TodoList />}
            </div>
          </section>
        )}
        {(telescopes.length > 0 || settings.showRubin) && (
          <section className="scopes" aria-label="Live telescope observations">
            {telescopes.map((t) => (
              <TelescopeCard key={t} telescope={t} />
            ))}
            {settings.showRubin && <RubinCard />}
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
