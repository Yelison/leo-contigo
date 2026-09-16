"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Map,
  Gamepad2,
  BarChart3,
  Star,
  Volume2,
  ChevronRight,
  ArrowLeft,
  Lock,
  Check,
  RotateCcw,
  Trophy,
  Sparkles,
  Flag,
  Heart,
  HardDrive,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useReadingVoice } from "@/lib/use-reading-voice";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { worlds, lessons, Lesson, Question } from "@/lib/curriculum";
type Attempt = {
  id: string;
  lesson: string;
  score: number;
  total: number;
  created: string;
};
type RewardSettings = {
  frame?: string;
  background?: string;
};
const PROGRESS_KEY = "leocontigo.progress.v1";
const REWARDS_KEY = "leocontigo.rewards.v1";
const path = worlds.slice(1).flatMap((w) => w.lessons);
const WORLD_LABELS = [
  "Repaso",
  "Sílabas",
  "Palabras",
  "Sonidos",
  "Frases",
  "Cuentos",
  "Fluidez",
  "Comprensión",
];
const WORLD_SCENES = ["🌼", "🔤", "🧩", "🎵", "🌉", "📖", "⛰️", "🏰"];
const REWARDS = [
  {
    id: "first-steps",
    stars: 5,
    icon: "🌱",
    name: "Primeros pasos",
    description: "Tu primera insignia de explorador",
    type: "Insignia",
    color: "mint",
  },
  {
    id: "leaf-frame",
    stars: 10,
    icon: "🍃",
    name: "Hojas verdes",
    description: "Un marco natural para tu avatar",
    type: "Marco",
    color: "green",
  },
  {
    id: "leo-reader",
    stars: 20,
    icon: "🐶",
    name: "Leo lector",
    description: "Una pegatina para tu colección",
    type: "Pegatina",
    color: "orange",
  },
  {
    id: "magic-library",
    stars: 35,
    icon: "📚",
    name: "Biblioteca mágica",
    description: "Un fondo lleno de historias",
    type: "Fondo",
    color: "purple",
  },
  {
    id: "word-hunter",
    stars: 50,
    icon: "🔎",
    name: "Cazador de palabras",
    description: "Una insignia para grandes detectives",
    type: "Insignia",
    color: "blue",
  },
  {
    id: "rainbow-frame",
    stars: 75,
    icon: "🌈",
    name: "Marco Arcoíris",
    description: "Todos los colores para tu avatar",
    type: "Marco",
    color: "pink",
  },
  {
    id: "great-explorer",
    stars: 100,
    icon: "🏆",
    name: "Gran explorador",
    description: "El trofeo de toda la aventura",
    type: "Trofeo",
    color: "gold",
  },
] as const;
function mastered(id: string, rows: Attempt[]) {
  const recent = rows.filter((a) => a.lesson === id);
  return recent.some(
    (a, i) =>
      a.score / a.total >= 0.8 &&
      recent[i + 1] &&
      recent[i + 1].score / recent[i + 1].total >= 0.8,
  );
}
function shuffle<T>(a: T[]) {
  return [...a].sort(() => Math.random() - 0.5);
}
function countStars(rows: Attempt[]) {
  return lessons.reduce((total, lesson) => {
    const best = Math.max(
      0,
      ...rows
        .filter((attempt) => attempt.lesson === lesson.id)
        .map((attempt) => attempt.score / attempt.total),
    );
    return total + (best === 1 ? 3 : best >= 0.8 ? 2 : best > 0 ? 1 : 0);
  }, 0);
}
const CONFETTI = Array.from({ length: 48 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  backgroundColor: [
    "#ff9c20",
    "#45aadd",
    "#7bc65b",
    "#f15b8a",
    "#ffd23f",
    "#8d72d8",
  ][i % 6],
  animationDelay: `${(i % 12) * 0.08}s`,
  animationDuration: `${2.2 + (i % 5) * 0.2}s`,
  width: 8 + (i % 3) * 3,
  height: 12 + (i % 4) * 2,
}));
export default function Home() {
  const [tab, setTab] = useState("learn"),
    [world, setWorld] = useState(1),
    [rows, setRows] = useState<Attempt[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [active, setActive] = useState<Lesson | null>(null),
    [questions, setQuestions] = useState<Question[]>([]),
    [index, setIndex] = useState(-1),
    [choices, setChoices] = useState<string[]>([]),
    [pieces, setPieces] = useState<string[]>([]),
    [picked, setPicked] = useState<number[]>([]),
    [feedback, setFeedback] = useState(""),
    [correct, setCorrect] = useState(false),
    [missed, setMissed] = useState(false),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false),
    [save, setSave] = useState(""),
    [pending, setPending] = useState<any>(null),
    [typed, setTyped] = useState(""),
    [heard, setHeard] = useState(false),
    [rewardSettings, setRewardSettings] = useState<RewardSettings>({}),
    [newReward, setNewReward] = useState<(typeof REWARDS)[number] | null>(null);
  const voice = useReadingVoice();
  function load() {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
      setRows(Array.isArray(saved) ? saved : []);
      const savedRewards = JSON.parse(
        localStorage.getItem(REWARDS_KEY) || "{}",
      );
      setRewardSettings(
        savedRewards && typeof savedRewards === "object" ? savedRewards : {},
      );
      setError("");
    } catch {
      setRows([]);
      setError("No pudimos leer el progreso guardado en este navegador.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function speak(t: string) {
    void voice.speak(t, () => setHeard(true));
  }
  function unlocked(l: Lesson) {
    if (loading || error) return false;
    const i = path.findIndex((x) => x.id === l.id);
    if (i >= 0) return i === 0 || mastered(path[i - 1].id, rows);
    const basics = worlds[0].lessons,
      j = basics.findIndex((x) => x.id === l.id);
    return j === 0 || mastered(basics[j - 1].id, rows);
  }
  function start(l: Lesson) {
    if (!unlocked(l)) return;
    const attempt = rows.filter((row) => row.lesson === l.id).length,
      round = l.rounds[attempt % l.rounds.length];
    setActive(l);
    voice.stop();
    setQuestions(shuffle(round));
    setIndex(-1);
    setScore(0);
    setDone(false);
    setFeedback("");
    setSave("");
    setPending(null);
    setNewReward(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setup(i: number) {
    voice.stop();
    const q = questions[i];
    setIndex(i);
    setChoices(shuffle(q.options));
    setPieces(shuffle(q.parts || []));
    setPicked([]);
    setTyped("");
    setHeard(false);
    setFeedback("");
    setCorrect(false);
    setMissed(false);
  }
  function answer(a: string) {
    if (correct) return;
    const q = questions[index];
    if (a.trim().toLocaleLowerCase("es") === q.answer.toLocaleLowerCase("es")) {
      setCorrect(true);
      setFeedback(
        missed
          ? "¡Lo encontraste! Practicar te ayuda a aprender."
          : "¡Muy bien! ¡Una pista más descubierta!",
      );
      if (!missed) setScore((s) => s + 1);
    } else {
      setMissed(true);
      setFeedback("Probemos otra vez. " + q.hint);
    }
  }
  function persist(b: Omit<Attempt, "created">) {
    setSave("saving");
    try {
      const next: Attempt[] = [
        { ...b, created: new Date().toISOString() },
        ...rows.filter((r) => r.id !== b.id),
      ].slice(0, 5000);
      const previousStars = countStars(rows);
      const updatedStars = countStars(next);
      const unlocked = REWARDS.filter(
        (reward) => reward.stars > previousStars && reward.stars <= updatedStars,
      );
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      setRows(next);
      setNewReward(unlocked.at(-1) || null);
      setSave("saved");
      setError("");
    } catch {
      setSave("error");
    }
  }
  function next() {
    if (index + 1 < questions.length) setup(index + 1);
    else {
      const b = {
        id: crypto.randomUUID(),
        lesson: active!.id,
        score,
        total: questions.length,
      };
      setPending(b);
      setDone(true);
      persist(b);
    }
  }
  const masteredCount = lessons.filter((l) => mastered(l.id, rows)).length,
    stars = countStars(rows);
  const suggested =
    path.find((l) => !mastered(l.id, rows)) || path[path.length - 1];
  const nextReward = REWARDS.find((reward) => reward.stars > stars);
  const previousRewardStars =
    [...REWARDS].reverse().find((reward) => reward.stars <= stars)?.stars || 0;
  const rewardProgress = nextReward
    ? ((stars - previousRewardStars) /
        (nextReward.stars - previousRewardStars)) *
      100
    : 100;
  const today = new Date().toLocaleDateString("en-CA"),
    daily = rows.filter(
      (r) => new Date(r.created).toLocaleDateString("en-CA") === today,
    ).length;
  const days = new Set(
    rows.map((r) => new Date(r.created).toLocaleDateString("en-CA")),
  ).size;
  function leave() {
    voice.stop();
    setActive(null);
  }
  function equipReward(reward: (typeof REWARDS)[number]) {
    const key = reward.type === "Marco" ? "frame" : "background";
    const next = { ...rewardSettings, [key]: reward.id };
    setRewardSettings(next);
    localStorage.setItem(REWARDS_KEY, JSON.stringify(next));
  }
  if (active) {
    const q = questions[index];
    return (
      <main className="exercise-shell">
        <header className="exercise-top">
          <button
            className="icon-button"
            aria-label="Volver al mapa"
            disabled={save === "saving" || save === "error"}
            onClick={leave}
          >
            <ArrowLeft />
          </button>
          <div>
            <small>Tu aventura de lectura</small>
            <strong>{active.title}</strong>
          </div>
          <span className="star-pill">
            <Star fill="currentColor" size={21} />
            {stars}
          </span>
        </header>
        {!done && (
          <Progress
            value={index < 0 ? 0 : (index / questions.length) * 100}
            aria-label="Progreso de la ronda"
            className="round-progress"
          />
        )}
        {done && (
          <div className="confetti" aria-hidden="true">
            {CONFETTI.map((piece, i) => (
              <span key={i} style={piece} />
            ))}
          </div>
        )}
        {index < 0 ? (
          <section className="exercise-card introduction">
            <div className="lesson-illustration" aria-hidden="true">
              {active.art}
            </div>
            <div className="intro-art">
              <img
                src="companions.png"
                alt="Leo el perrito y Mía la gatita leen juntos"
              />
            </div>
            <span className="eyebrow">DESCUBRE · PRACTICA · JUEGA</span>
            <h1>{active.title}</h1>
            <p>{active.teach}</p>
            <button className="listen" onClick={() => speak(active.teach)}>
              <Volume2 /> Escuchar explicación
            </button>
            <button className="primary big" onClick={() => setup(0)}>
              ¡Vamos a jugar! <ChevronRight />
            </button>
            <small>{questions.length} ejercicios nuevos · Sin prisa</small>
          </section>
        ) : done ? (
          <section className="exercise-card celebration">
            <div className="completion-art" aria-hidden="true">
              {active.art}
            </div>
            <div className="trophy">
              <Trophy size={74} />
            </div>
            <span className="eyebrow">¡DESAFÍO COMPLETADO!</span>
            <h1>
              {score / questions.length >= 0.8
                ? "¡Buen trabajo, explorador!"
                : "¡Hoy aprendiste algo nuevo!"}
            </h1>
            <p>
              Acertaste {score} de {questions.length} al primer intento.
            </p>
            {newReward && (
              <div className="new-reward" role="status">
                <span aria-hidden="true">{newReward.icon}</span>
                <div>
                  <small>¡NUEVA RECOMPENSA!</small>
                  <strong>{newReward.name}</strong>
                </div>
              </div>
            )}
            <div className="huge-stars">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  size={46}
                  fill={
                    n <=
                    (score === questions.length
                      ? 3
                      : score / questions.length >= 0.8
                        ? 2
                        : 1)
                      ? "#ffbf24"
                      : "transparent"
                  }
                />
              ))}
            </div>
            <p>
              {mastered(active.id, rows)
                ? "¡Desafío dominado! Ya puedes seguir tu camino."
                : score / questions.length >= 0.8
                  ? "Una ronda muy buena. La próxima ronda tendrá ejercicios diferentes."
                  : "Volvamos a practicar con una ronda nueva y ejercicios diferentes."}
            </p>
            <div role="status" className="save-status">
              {save === "saving"
                ? "Guardando tu aventura…"
                : save === "saved"
                  ? "✓ Tu progreso está guardado"
                  : save === "error"
                    ? "No se pudo guardar. Tu resultado sigue aquí."
                    : ""}
            </div>
            {save === "error" ? (
              <button className="primary" onClick={() => persist(pending)}>
                Volver a guardar
              </button>
            ) : (
              <div className="action-row">
                <button
                  disabled={save !== "saved"}
                  className="primary"
                  onClick={leave}
                >
                  Ver mi camino <ChevronRight />
                </button>
                <button
                  disabled={save !== "saved"}
                  className="secondary"
                  onClick={() => start(active)}
                >
                  <RotateCcw /> Jugar la ronda nueva
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="exercise-card">
            <span className="eyebrow">
              EJERCICIO {index + 1} DE {questions.length}
            </span>
            <div className="question-illustration" aria-hidden="true">
              {active.art}
            </div>
            <h1>{q.prompt}</h1>
            <button
              className={"listen " + (q.audio ? "audio-main" : "")}
              onClick={() =>
                speak(
                  q.audio ? q.read! : q.prompt + (q.read ? ". " + q.read : ""),
                )
              }
            >
              <Volume2 /> {q.audio ? "Escuchar la palabra" : "Escuchar"}
            </button>
            {q.audio && !heard && (
              <p className="help-text">Primero pulsa el altavoz y escucha.</p>
            )}
            {q.isStory ? (
              <div className="story">{q.read}</div>
            ) : q.parts && !q.audio ? (
              <div className="word-target">{q.answer}</div>
            ) : null}
            {q.typing ? (
              <div className="dictation">
                <label htmlFor="dictation-input">Tu palabra</label>
                <Input
                  id="dictation-input"
                  value={typed}
                  disabled={correct || !heard}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={30}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typed && heard) answer(typed);
                  }}
                />
                <div className="keyboard">
                  {"abcdefghijklmnñopqrstuvwxyzáéíóúü".split("").map((c) => (
                    <button
                      key={c}
                      disabled={correct || !heard}
                      onClick={() => setTyped((v) => (v + c).slice(0, 30))}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    className="erase-key"
                    disabled={correct || !heard}
                    onClick={() => setTyped((v) => v.slice(0, -1))}
                  >
                    ⌫ Borrar
                  </button>
                </div>
                <button
                  className="primary"
                  disabled={correct || !typed || !heard}
                  onClick={() => answer(typed)}
                >
                  Comprobar <Check />
                </button>
              </div>
            ) : q.parts ? (
              <>
                <div className="slots" aria-label="Tu respuesta">
                  {picked.length ? (
                    picked.map((p, i) => (
                      <button
                        key={i}
                        disabled={correct}
                        className="tile selected"
                        aria-label={`Quitar ${pieces[p]}`}
                        onClick={() =>
                          setPicked((v) => v.filter((_, j) => j !== i))
                        }
                      >
                        {pieces[p]}
                      </button>
                    ))
                  ) : (
                    <span>Toca las piezas de abajo</span>
                  )}
                </div>
                <div className="options">
                  {pieces.map((p, i) => (
                    <button
                      key={i}
                      className="tile"
                      disabled={
                        picked.includes(i) || correct || (q.audio && !heard)
                      }
                      onClick={() => setPicked((v) => [...v, i])}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="action-row">
                  <button
                    className="secondary"
                    disabled={correct || !picked.length}
                    onClick={() => setPicked([])}
                  >
                    <RotateCcw /> Borrar
                  </button>
                  <button
                    className="primary"
                    disabled={correct || picked.length !== pieces.length}
                    onClick={() =>
                      answer(
                        picked
                          .map((i) => pieces[i])
                          .join(q.answer.includes(" ") ? " " : ""),
                      )
                    }
                  >
                    Comprobar <Check />
                  </button>
                </div>
              </>
            ) : (
              <div className="options">
                {choices.map((c) => (
                  <button
                    key={c}
                    className={
                      "tile " + (correct && c === q.answer ? "right" : "")
                    }
                    disabled={correct || (q.audio && !heard)}
                    onClick={() => answer(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div
              aria-live="polite"
              className={"feedback " + (correct ? "success" : "")}
            >
              {feedback}
            </div>
            {correct && (
              <button autoFocus className="primary big" onClick={next}>
                {index + 1 === questions.length
                  ? "Terminar aventura"
                  : "Siguiente"}{" "}
                <ChevronRight />
              </button>
            )}
            <p className="help-text">
              Puedes escuchar de nuevo. Aquí no hay prisa.
            </p>
          </section>
        )}
        {voice.status && (
          <p role="status" className="voice-status">
            {voice.status}
          </p>
        )}
      </main>
    );
  }
  return (
    <div
      className={`app ${
        rewardSettings.background === "magic-library"
          ? "app-magic-library"
          : ""
      }`}
    >
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-book">
            <BookOpen size={28} />
          </span>
          Leo<span>Contigo</span>
        </a>
        <div className="header-right">
          <button
            className="star-pill star-button"
            onClick={() => setTab("rewards")}
            aria-label={`${stars} estrellas. Ver mis recompensas`}
          >
            <Star size={20} fill="currentColor" />
            {stars} <span>estrellas</span>
          </button>
          <div
            className={`avatar ${
              rewardSettings.frame ? `avatar-${rewardSettings.frame}` : ""
            }`}
          >
            L
          </div>
        </div>
      </header>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="nav-wrap">
          <TabsList className="main-nav">
            <TabsTrigger value="learn">
              <Map /> Mi aventura
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 /> Mis desafíos
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift /> Recompensas
            </TabsTrigger>
            <TabsTrigger value="progress">
              <BarChart3 /> Mi progreso
            </TabsTrigger>
            <TabsTrigger value="family">
              <ShieldCheck /> Para la familia
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="page-wrap">
          {error && (
            <div className="error" role="alert">
              {error} <button onClick={load}>Reintentar</button>
            </div>
          )}
          <TabsContent value="learn">
            <div className="greeting">
              <div>
                <span className="eyebrow">
                  UN POQUITO CADA DÍA, UNA GRAN AVENTURA
                </span>
                <h1>
                  ¡Hola, pequeño explorador! <span className="wave">✦</span>
                </h1>
                <p>Leo y Mía te esperan. ¿Qué descubriremos hoy?</p>
              </div>
              <span className="session-label">
                <Heart size={18} /> A tu ritmo
              </span>
            </div>
            <div className="home-grid">
              <div>
                <section className="hero">
                  <div className="hero-copy">
                    <span className="tag">TU SIGUIENTE MISIÓN</span>
                    <h2>
                      ¡Juntos suena
                      <br />
                      mucho mejor!
                    </h2>
                    <p>
                      {suggested.title}
                      <br />
                      Escucha, une y descubre.
                    </p>
                    <button
                      className="primary"
                      disabled={!unlocked(suggested)}
                      onClick={() => start(suggested)}
                    >
                      {loading ? "Cargando…" : "¡Vamos a leer!"}{" "}
                      <ChevronRight />
                    </button>
                    <span className="hero-foot">
                      Pequeños pasos. Grandes descubrimientos.
                    </span>
                  </div>
                  <img
                    className="mascot"
                    src="companions.png"
                    alt="Un perrito dorado y una gatita naranja con un libro abierto"
                  />
                </section>
                <div className="section-heading">
                  <h2>Tu camino de lectura</h2>
                  <span>
                    {masteredCount} de {lessons.length} desafíos dominados
                  </span>
                </div>
                <section
                  className="adventure-map"
                  aria-label="Mapa del camino de lectura"
                >
                  <span className="map-cloud cloud-one" aria-hidden="true">
                    ☁️
                  </span>
                  <span className="map-cloud cloud-two" aria-hidden="true">
                    ☁️
                  </span>
                  <span className="map-tree tree-one" aria-hidden="true">
                    🌳
                  </span>
                  <span className="map-tree tree-two" aria-hidden="true">
                    🌲
                  </span>
                  <span className="map-books" aria-hidden="true">
                    📚
                  </span>
                  <svg
                    className="map-trail"
                    viewBox="0 0 1000 700"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M130 610 C330 610 360 520 230 465 C100 410 180 320 410 350 C650 382 790 315 730 245 C660 170 675 95 880 75" />
                  </svg>
                  <div className="map-mascots" aria-hidden="true">
                    <img src="companions.png" alt="" />
                  </div>
                  {worlds.map((w, i) => {
                    const complete = w.lessons.every((lesson) =>
                      mastered(lesson.id, rows),
                    );
                    const available =
                      i === 0 || w.lessons.some((lesson) => unlocked(lesson));
                    const state = complete
                      ? "complete"
                      : i === world && available
                        ? "current"
                        : available
                          ? "available"
                          : "locked";
                    return (
                      <button
                        key={w.title}
                        onClick={() => setWorld(i)}
                        className={`map-stage stage-${i} ${state}`}
                        aria-pressed={i === world}
                        aria-label={`${WORLD_LABELS[i]}: ${complete ? "completado" : available ? "disponible" : "bloqueado"}`}
                        disabled={!available}
                      >
                        {state === "current" && (
                          <span className="you-are-here">Estás aquí</span>
                        )}
                        <span className="stage-scene" aria-hidden="true">
                          {WORLD_SCENES[i]}
                        </span>
                        <span className="stage-node">
                          {complete ? (
                            <Check />
                          ) : state === "locked" ? (
                            <Lock size={24} />
                          ) : i === 0 ? (
                            "A"
                          ) : (
                            i
                          )}
                        </span>
                        <strong>{WORLD_LABELS[i]}</strong>
                      </button>
                    );
                  })}
                </section>
                <section className="world-panel">
                  <div className="world-heading">
                    <div>
                      <span className="eyebrow">
                        {world === 0
                          ? "REPASO OPCIONAL"
                          : `ETAPA ${world} DE 7`}
                      </span>
                      <h3>{worlds[world].title}</h3>
                      <p>{worlds[world].subtitle}</p>
                    </div>
                    <span className={"world-icon " + worlds[world].color}>
                      <BookOpen />
                    </span>
                  </div>
                  <div className="lesson-grid">
                    {worlds[world].lessons.map((l, i) => {
                      const open = unlocked(l),
                        complete = mastered(l.id, rows),
                        passed = complete
                          ? 2
                          : rows.find((a) => a.lesson === l.id) &&
                              rows.filter((a) => a.lesson === l.id)[0].score /
                                rows.filter((a) => a.lesson === l.id)[0]
                                  .total >=
                                0.8
                            ? 1
                            : 0;
                      return (
                        <button
                          key={l.id}
                          className={
                            "lesson " +
                            (!open ? "locked" : "") +
                            (complete ? " completed" : "")
                          }
                          disabled={!open}
                          onClick={() => start(l)}
                        >
                          <span className="lesson-num">
                            {complete ? (
                              <Check />
                            ) : open ? (
                              i + 1
                            ) : (
                              <Lock size={22} />
                            )}
                          </span>
                          <strong>{l.title}</strong>
                          <small>
                            {complete
                              ? "¡Lo dominas!"
                              : open
                                ? `${passed}/2 rondas logradas`
                                : "Completa el anterior"}
                          </small>
                          <span className="lesson-stars">
                            {[0, 1].map((n) => (
                              <Star
                                key={n}
                                size={18}
                                fill={n < passed ? "#ffc627" : "none"}
                              />
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
              <aside className="right-column">
                <section className="daily-card">
                  <div className="side-title">
                    <span className="square-icon yellow">
                      <Flag />
                    </span>
                    <h3>Tu reto de hoy</h3>
                  </div>
                  <p>
                    Una pequeña aventura
                    <br />
                    para seguir creciendo.
                  </p>
                  <div className="daily-count">
                    <strong>
                      {Math.min(daily, 1)}
                      <span> / 1</span>
                    </strong>
                    <span>ronda</span>
                  </div>
                  <Progress
                    value={Math.min(daily, 1) * 100}
                    aria-label="Reto diario"
                  />
                  <p className="tiny">
                    {daily
                      ? "¡Reto conseguido! Puedes descansar o seguir jugando."
                      : "Completa una ronda de tu camino."}
                  </p>
                  <button
                    className="secondary full"
                    onClick={() => start(suggested)}
                    disabled={!unlocked(suggested)}
                  >
                    {daily ? "Seguir explorando" : "Aceptar el reto"}{" "}
                    <ChevronRight size={18} />
                  </button>
                </section>
                <section className="encouragement">
                  <Sparkles size={24} />
                  <h3>¡Tú puedes!</h3>
                  <p>
                    Equivocarse también
                    <br />
                    es aprender.
                  </p>
                  <div className="character-crop">
                    <img src="companions.png" alt="Leo y Mía te acompañan" />
                  </div>
                </section>
                <section className="save-note">
                  <HardDrive size={22} />
                  <p>
                    {loading
                      ? "Buscando tu aventura…"
                      : error
                        ? "Guardado no disponible"
                        : "Tu aventura se guarda en este navegador."}
                  </p>
                </section>
              </aside>
            </div>
          </TabsContent>
          <TabsContent value="games">
            <div className="greeting">
              <div>
                <span className="eyebrow">APRENDER JUGANDO</span>
                <h1>Mis desafíos</h1>
                <p>Elige una aventura desbloqueada. Repetir también cuenta.</p>
              </div>
            </div>
            <div className="game-grid">
              {worlds.map((w, i) => (
                <section className={"game-card " + w.color} key={w.title}>
                  <span className="square-icon">
                    <Gamepad2 />
                  </span>
                  <h2>{w.title}</h2>
                  <p>{w.goal}</p>
                  {w.lessons.map((l) => (
                    <button
                      className="game-link"
                      key={l.id}
                      disabled={!unlocked(l)}
                      onClick={() => start(l)}
                    >
                      {l.title}
                      {mastered(l.id, rows) ? (
                        <Check />
                      ) : unlocked(l) ? (
                        <ChevronRight />
                      ) : (
                        <Lock size={18} />
                      )}
                    </button>
                  ))}
                </section>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="rewards">
            <section className="rewards-hero">
              <div className="rewards-hero-copy">
                <span className="eyebrow">CADA ESTRELLA CUENTA</span>
                <h1>Mis recompensas</h1>
                <p>
                  Lee, practica y llena tu vitrina de recuerdos. Tus estrellas
                  nunca se gastan.
                </p>
                <div className="next-reward-progress">
                  <div>
                    <span>
                      {nextReward ? "TU PRÓXIMO PREMIO" : "¡COLECCIÓN COMPLETA!"}
                    </span>
                    <strong>
                      {nextReward
                        ? `${nextReward.icon} ${nextReward.name}`
                        : "🏆 Gran explorador"}
                    </strong>
                  </div>
                  <b>{nextReward ? `${stars} / ${nextReward.stars}` : stars}</b>
                  <Progress
                    value={rewardProgress}
                    aria-label={
                      nextReward
                        ? `Progreso para ${nextReward.name}: ${stars} de ${nextReward.stars} estrellas`
                        : "Todas las recompensas conseguidas"
                    }
                  />
                  <small>
                    {nextReward
                      ? `Te faltan ${nextReward.stars - stars} estrellas`
                      : "¡Has desbloqueado todos los premios!"}
                  </small>
                </div>
              </div>
              <div className="rewards-showcase" aria-hidden="true">
                <span>🌈</span>
                <div className="reward-chest">🎁</div>
                <span>🏆</span>
              </div>
            </section>

            <div className="rewards-heading">
              <div>
                <span className="eyebrow">TU VITRINA</span>
                <h2>Premios de la aventura</h2>
              </div>
              <span className="reward-total">
                <Star fill="currentColor" /> {stars} estrellas
              </span>
            </div>

            <section className="rewards-grid" aria-label="Premios de la aventura">
              {REWARDS.map((reward) => {
                const earned = stars >= reward.stars;
                const isNext = nextReward?.id === reward.id;
                return (
                  <article
                    className={`reward-card ${reward.color} ${
                      earned ? "reward-earned" : isNext ? "reward-next" : "reward-locked"
                    }`}
                    key={reward.id}
                  >
                    <div className="reward-card-top">
                      <span className="reward-kind">{reward.type}</span>
                      <span className="reward-cost">
                        <Star size={16} fill="currentColor" /> {reward.stars}
                      </span>
                    </div>
                    <div className="reward-icon" aria-hidden="true">
                      {reward.icon}
                    </div>
                    <h3>{reward.name}</h3>
                    <p>{reward.description}</p>
                    <div className="reward-state">
                      {earned ? (
                        <><Check size={18} /> ¡Conseguida!</>
                      ) : isNext ? (
                        <><Sparkles size={18} /> Tu próximo premio</>
                      ) : (
                        <><Lock size={17} /> Se abre con {reward.stars} estrellas</>
                      )}
                    </div>
                    {earned &&
                      (reward.type === "Marco" || reward.type === "Fondo") && (
                        <button
                          className="reward-use"
                          onClick={() => equipReward(reward)}
                          disabled={
                            rewardSettings[
                              reward.type === "Marco" ? "frame" : "background"
                            ] === reward.id
                          }
                        >
                          {rewardSettings[
                            reward.type === "Marco" ? "frame" : "background"
                          ] === reward.id
                            ? "✓ En uso"
                            : "Usar recompensa"}
                        </button>
                      )}
                  </article>
                );
              })}
            </section>
            <p className="rewards-note">
              <ShieldCheck size={18} /> Las recompensas celebran tu esfuerzo:
              no se compran, no se pierden y no bloquean las lecciones.
            </p>
          </TabsContent>
          <TabsContent value="progress">
            <div className="greeting">
              <div>
                <span className="eyebrow">CADA PASO CUENTA</span>
                <h1>¡Mira cuánto has avanzado!</h1>
                <p>Tu camino, tus descubrimientos, tus logros.</p>
              </div>
            </div>
            <div className="stats">
              <section>
                <Star />
                <strong>{stars}</strong>
                <span>Estrellas ganadas</span>
              </section>
              <section>
                <Flag />
                <strong>
                  {masteredCount}/{lessons.length}
                </strong>
                <span>Desafíos dominados</span>
              </section>
              <section>
                <Heart />
                <strong>{days}</strong>
                <span>Días de práctica</span>
              </section>
            </div>
            <section className="world-panel">
              <h2>Tu recorrido</h2>
              <p>
                El porcentaje indica desafíos dominados dentro de esta ruta.
              </p>
              {worlds.map((w) => {
                const n = w.lessons.filter((l) => mastered(l.id, rows)).length;
                return (
                  <div className="progress-line" key={w.title}>
                    <div>
                      <strong>{w.title}</strong>
                      <span>
                        {n}/{w.lessons.length}
                      </span>
                    </div>
                    <Progress
                      value={(n / w.lessons.length) * 100}
                      aria-label={w.title}
                    />
                  </div>
                );
              })}
            </section>
            <section className="world-panel">
              <h2>Mis logros</h2>
              <div className="badges">
                {[
                  ["Primera aventura", rows.length > 0],
                  [
                    "Explorador de sílabas",
                    worlds[1].lessons.every((l) => mastered(l.id, rows)),
                  ],
                  [
                    "Constructor de palabras",
                    worlds[2].lessons.every((l) => mastered(l.id, rows)),
                  ],
                  [
                    "Lector de historias",
                    worlds[5].lessons.every((l) => mastered(l.id, rows)),
                  ],
                ].map(([t, b]) => (
                  <div className={b ? "earned" : ""} key={String(t)}>
                    <Trophy />
                    <strong>{String(t)}</strong>
                    <small>{b ? "¡Conseguido!" : "Sigue tu camino"}</small>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="family">
            <div className="greeting">
              <div>
                <span className="eyebrow">ACOMPAÑAR SU APRENDIZAJE</span>
                <h1>Un plan, muchos descubrimientos</h1>
                <p>
                  Punto de partida: reconoce letras. Comenzamos con sílabas.
                </p>
              </div>
            </div>
            <section className="world-panel voice-panel">
              <div className="voice-heading">
                <span className="square-icon blue">
                  <Volume2 />
                </span>
                <div>
                  <h2>Voz de lectura</h2>
                  <p>
                    Escucha una muestra y elige la voz que le guste a tu hijo.
                  </p>
                </div>
              </div>
              <div className="voice-controls">
                <div>
                  <label htmlFor="reading-voice">Voz en español</label>
                  <NativeSelect
                    id="reading-voice"
                    disabled={!voice.supported || !voice.ready}
                    value={
                      voice.settings.voice === "auto" ||
                      voice.voices.some(
                        (v) => v.voiceURI === voice.settings.voice,
                      )
                        ? voice.settings.voice
                        : "auto"
                    }
                    onChange={(e) => voice.configure({ voice: e.target.value })}
                  >
                    <NativeSelectOption value="auto">
                      Selección automática
                    </NativeSelectOption>
                    {voice.voices.map((v, i) => (
                      <NativeSelectOption
                        key={v.voiceURI + "-" + i}
                        value={v.voiceURI}
                      >
                        {v.name} · {v.lang}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <p className="voice-caption">
                    {voice.chosen
                      ? `Voz actual: ${voice.chosen.name}`
                      : voice.ready
                        ? "Buscando voces disponibles…"
                        : "Cargando…"}
                  </p>
                </div>
                <div>
                  <label id="reading-speed">
                    Ritmo de lectura · {Math.round(voice.settings.rate * 100)}%
                  </label>
                  <Slider
                    aria-labelledby="reading-speed"
                    min={75}
                    max={110}
                    step={5}
                    value={[Math.round(voice.settings.rate * 100)]}
                    onValueChange={(v: number[]) =>
                      voice.configure({ rate: v[0] / 100 })
                    }
                  />
                  <div className="speed-labels">
                    <span>Más pausado</span>
                    <span>Más ágil</span>
                  </div>
                </div>
              </div>
              <div className="voice-actions">
                <button
                  className="primary"
                  disabled={!voice.supported}
                  onClick={() =>
                    void voice.speak(
                      "¡Hola! Soy tu compañero de lectura. Hoy vamos a descubrir palabras juntos. Escucha: luna, mesa, pato. ¡Muy bien! Vamos paso a paso.",
                    )
                  }
                >
                  <Volume2 /> Probar esta voz
                </button>
                <button
                  className="secondary"
                  disabled={!voice.speaking}
                  onClick={voice.stop}
                >
                  Detener
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    voice.refresh();
                    void voice.speak("Vamos a leer juntos.");
                  }}
                >
                  Buscar voces
                </button>
              </div>
              <p className="voice-caption">
                Tu elección se guarda en este navegador. La selección automática
                prioriza voces identificadas como naturales y variantes
                latinoamericanas cuando están disponibles. Puedes cambiarla
                después de escuchar.
              </p>
              {voice.status && (
                <p role="status" className="voice-status">
                  {voice.status}
                </p>
              )}
              {voice.ready && voice.voices.length === 1 && (
                <p className="voice-caption">
                  Este navegador ofrece una sola voz en español. Para tener más
                  opciones, necesitarás otras voces instaladas o un servicio de
                  narración.
                </p>
              )}
            </section>
            <div className="family-intro">
              <section className="world-panel">
                <h2>Cómo se avanza</h2>
                <p>
                  Cada desafío necesita dos rondas consecutivas con al menos 80%
                  de aciertos al primer intento. Las respuestas con ayuda
                  permiten terminar el ejercicio, pero no aumentan ese
                  resultado. Cada ronda contiene siete ejercicios. Al repetir un
                  desafío se usa una misión diferente, no la misma lista en otro
                  orden.
                </p>
                <p>
                  Una vez logrado un desafío, permanece desbloqueado. Los
                  errores posteriores sirven para repasar; no quitan logros. Las
                  estrellas conservan el mejor resultado. El umbral del 80% es
                  una regla de esta aplicación, no un baremo diagnóstico ni una
                  certificación de lectura.
                </p>
                <p>
                  El repaso de vocales y sonidos tiene un recorrido
                  independiente. No se marca como aprendido por reconocer
                  letras.
                </p>
              </section>
              <section className="world-panel">
                <h2>Una sesión sencilla</h2>
                <ol>
                  <li>Recuerda una palabra de ayer.</li>
                  <li>Escuchen la explicación y prueben juntos.</li>
                  <li>Deja que resuelva una ronda con calma.</li>
                  <li>Lean algo fuera de la pantalla.</li>
                  <li>Celebren el esfuerzo y descansen.</li>
                </ol>
                <p>
                  Empiecen con unos 10 minutos y ajusten a su atención. No hay
                  penalizaciones por faltar un día.
                </p>
              </section>
            </div>
            <section className="world-panel">
              <h2>Plan completo de la ruta</h2>
              <p>
                Progresión explícita: escuchar → relacionar sonido y letra →
                unir sílabas → leer y escribir palabras → comprender frases y
                textos. Los dictados se introducen después de aprender las
                letras necesarias.
              </p>
              <div className="plan-list">
                {worlds.map((w, i) => (
                  <article key={w.title}>
                    <span className={"plan-num " + w.color}>
                      {i === 0 ? "A" : i}
                    </span>
                    <div>
                      <h3>{w.title}</h3>
                      <p>
                        <b>Objetivo:</b> {w.goal}
                      </p>
                      <p>
                        <b>En casa:</b> {w.home}
                      </p>
                      <small>{w.lessons.map((l) => l.title).join(" · ")}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="world-panel">
              <h2>Lo que nos dicen los resultados</h2>
              <p>
                Esta ruta practica desde las bases hasta comprensión de textos
                breves. Completarla no certifica saber leer «al 100%»: la
                lectura crece con textos nuevos, vocabulario y práctica
                acompañada. La app no evalúa pronunciación ni fluidez oral
                automáticamente; un adulto debe escuchar la lectura y observar
                las pausas y la comprensión.
              </p>
              <p>
                Las ilustraciones tienen aspecto 3D y movimiento suave; el audio
                usa las voces en español disponibles en el dispositivo. El
                espacio es familiar y privado: el progreso permanece guardado en
                este navegador.
              </p>
              <h3>Referencias y aplicación</h3>
              <p>
                <a
                  href="https://ies.ed.gov/ncee/wwc/PracticeGuide/21"
                  target="_blank"
                  rel="noreferrer"
                >
                  IES / What Works Clearinghouse: Foundational Skills (2016,
                  revisión 2019)
                </a>
                . La guía recomienda trabajar sonidos y letras, decodificación y
                escritura, y lectura diaria de textos. Aquí se aplica en
                ejercicios de combinación, dictado y lectura acompañada. Sus
                estudios no validan específicamente esta app ni su umbral de
                avance.
              </p>
              <p>
                <a
                  href="https://sigloxxieditores.com.ar/libro/aprender-a-leer/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Stanislas Dehaene: Aprender a leer. De las ciencias cognitivas
                  al aula (2015)
                </a>
                . Se consultó la presentación editorial, que destaca la conexión
                entre lenguaje oral y letras, el avance gradual y la diversidad
                de ejemplos. Los ejercicios y cuentos son originales; no se
                reproduce el libro.
              </p>
              <p>
                La enseñanza de sonidos aislados requiere un modelo oral claro.
                Las voces automáticas pueden decir el nombre de una consonante
                en vez de su sonido; por eso el audio de la app usa
                principalmente sílabas y palabras completas. Acompaña la unión
                de sonidos con tu voz.
              </p>
              <h3>Últimas rondas</h3>
              {rows.length ? (
                <div className="history">
                  {rows.slice(0, 10).map((r) => (
                    <div key={r.id}>
                      <span>
                        {lessons.find((l) => l.id === r.lesson)?.title}
                      </span>
                      <strong>
                        {r.score}/{r.total}
                      </strong>
                      <small>
                        {new Date(r.created).toLocaleDateString("es-DO")}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  Aún no hay rondas guardadas. ¡La primera aventura está lista!
                </p>
              )}
            </section>
          </TabsContent>
        </div>
      </Tabs>
      <footer>
        <BookOpen size={18} />
        <strong>LeoContigo</strong>
        <span>Pequeños pasos, grandes historias.</span>
      </footer>
    </div>
  );
}
