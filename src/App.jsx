import { useState, useEffect, useMemo, useRef } from "react";
import { loadJSON, saveJSON } from "./storage.js";
import { norm, parseCloze, pickCard, todayKey, profLabel } from "./helpers.js";
import { ClozeLine } from "./components/ClozeLine.jsx";
import { Pad } from "./components/Pad.jsx";
import { AttackCard } from "./components/AttackCard.jsx";
import { BrowseView } from "./components/BrowseView.jsx";
import { StatsView } from "./components/StatsView.jsx";

export default function App({ db }) {
  const [stage, setStage] = useState("loading");
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [profile, setProfile] = useState({ proficiency: {} });
  const [mode, setMode] = useState("drill"); // drill | blurt | ladder | attack
  const [subject, setSubject] = useState("mixed");
  const saveTimer = useRef(null);

  /* drill state */
  const [card, setCard] = useState(null);
  const [tier, setTier] = useState("front");
  const [clozeVals, setClozeVals] = useState([]);
  const [clozeResults, setClozeResults] = useState([]);
  const [mcqPick, setMcqPick] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [revealed, setRevealed] = useState(false);

  /* blurt state */
  const [blurt, setBlurt] = useState(null);
  const [blurtText, setBlurtText] = useState("");
  const [blurtPhase, setBlurtPhase] = useState("write"); // write | score | done
  const [hits, setHits] = useState([]);
  const [secs, setSecs] = useState(300);
  const [running, setRunning] = useState(false);

  /* ladder state */
  const [ladder, setLadder] = useState(null);
  const [countGuess, setCountGuess] = useState("");
  const [lPhase, setLPhase] = useState("count"); // count | fill | graded
  const [slotVals, setSlotVals] = useState([]);
  const [lResults, setLResults] = useState(null);

  /* ---- boot ---- */
  useEffect(() => {
    (async () => {
      const last = loadJSON("bl:lastuser");
      if (last && last.email) {
        const p = ((loadJSON("bl:user:" + last.email))) || { proficiency: {} };
        setEmail(last.email);
        setProfile(p);
        setStage("app");
      } else setStage("login");
    })();
  }, []);

  /* ---- timer ---- */
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); setBlurtPhase("score"); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secs]);

  /* ---- pools ---- */
  const subjectKeys = Object.keys(db);
  const cardPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => db[k].cards.map((c) => ({ ...c, _s: k })));
    return db[subject].cards.map((c) => ({ ...c, _s: subject }));
  }, [subject]);
  const blurtPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => (db[k].blurts || []).map((b) => ({ ...b, _s: k })));
    return (db[subject].blurts || []).map((b) => ({ ...b, _s: subject }));
  }, [subject]);
  const ladderPool = useMemo(() => {
    if (subject === "mixed") return subjectKeys.flatMap((k) => (db[k].ladders || []).map((l) => ({ ...l, _s: k })));
    return (db[subject].ladders || []).map((l) => ({ ...l, _s: subject }));
  }, [subject]);

  /* ---- deal on mode/subject change ---- */
  useEffect(() => {
    if (stage !== "app") return;
    if (mode === "drill") dealCard(null);
    if (mode === "blurt") dealBlurt(null);
    if (mode === "ladder") dealLadder(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mode, subject]);

  /* ---- persistence ---- */
  function persist(next) {
    setProfile(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveJSON("bl:user:" + email, next), 150);
  }
  function setProf(id, v) {
    persist({ ...profile, proficiency: { ...profile.proficiency, [id]: v } });
  }
  /* record() writes proficiency AND the attempt log in one pass, so the
     two never clobber each other by both calling persist(). */
  function record(id, v, ok) {
    const st = { ...(profile.stats || {}) };
    const cur = st[id] || { seen: 0, right: 0 };
    st[id] = { seen: cur.seen + 1, right: cur.right + (ok ? 1 : 0), last: Date.now() };
    const days = { ...(profile.days || {}) };
    const k = todayKey();
    days[k] = (days[k] || 0) + 1;
    persist({ ...profile, proficiency: { ...profile.proficiency, [id]: v }, stats: st, days });
  }
  function bump(id) {
    setProf(id, Math.min(5, (profile.proficiency[id] ?? 0) + 1));
  }
  function up(id) { return Math.min(5, (profile.proficiency[id] ?? 0) + 1); }

  function exportProgress() {
    const blob = new Blob([JSON.stringify({ email, profile }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "black-letter-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importProgress(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { const d = JSON.parse(r.result); if (d && d.profile) persist(d.profile); }
      catch (err) { console.error("bad import", err); }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  function login() {
    const em = emailInput.trim().toLowerCase();
    if (!em || !em.includes("@")) return;
    const p = ((loadJSON("bl:user:" + em))) || { proficiency: {} };
    setEmail(em);
    setProfile(p);
    saveJSON("bl:lastuser", { email: em });
    setStage("app");
  }

  /* ---- deal helpers ---- */
  function dealCard(excludeId) {
    if (!cardPool.length) { setCard(null); return; }
    const next = pickCard(cardPool, profile.proficiency, excludeId);
    setCard(next);
    setTier(next.type === "cloze" ? "fallback" : "front");
    setClozeVals([]); setClozeResults([]); setMcqPick(null); setStamp(null); setRevealed(false);
  }
  function dealBlurt(excludeId) {
    if (!blurtPool.length) { setBlurt(null); return; }
    const next = pickCard(blurtPool, profile.proficiency, excludeId);
    setBlurt(next);
    setBlurtText(""); setBlurtPhase("write"); setHits([]);
    setSecs(300); setRunning(false);
  }
  function dealLadder(excludeId) {
    if (!ladderPool.length) { setLadder(null); return; }
    const next = pickCard(ladderPool, profile.proficiency, excludeId);
    setLadder(next);
    setCountGuess(""); setLPhase("count");
    setSlotVals(new Array(next.slots.length).fill(""));
    setLResults(null);
  }

  /* ---- drill grading (unchanged behaviour) ---- */
  function gradeCloze(text) {
    const parts = parseCloze(text).filter((p) => p.t === "blank");
    const results = parts.map((p, i) => norm(clozeVals[i]) === norm(p.v) && norm(clozeVals[i]) !== "");
    const allRight = results.every(Boolean);
    setClozeResults(results);
    setTier("graded");
    if (card.type === "cloze") {
      if (allRight) { record(card.id, up(card.id), true); setStamp({ text: "CORRECT", good: true }); }
      else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    } else {
      if (allRight) { record(card.id, Math.max(1, profile.proficiency[card.id] ?? 0), true); setStamp({ text: "HOLDS", good: true }); }
      else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    }
    setRevealed(true);
  }
  function gradeMcq(idx) {
    setMcqPick(idx); setTier("graded");
    if (idx === card.correct) { record(card.id, up(card.id), true); setStamp({ text: "CORRECT", good: true }); }
    else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); }
    setRevealed(true);
  }
  function knowIt() { record(card.id, up(card.id), true); setStamp({ text: "KNOWN", good: true }); setTier("graded"); setRevealed(true); }
  function needHelp() {
    if (card.fallback) setTier("fallback");
    else { record(card.id, 0, false); setStamp({ text: "STUDY PILE", good: false }); setTier("graded"); setRevealed(true); }
  }

  /* ---- blurt scoring ---- */
  function finishBlurt() { setRunning(false); setBlurtPhase("score"); }
  function commitBlurt() {
    const n = hits.filter(Boolean).length;
    const total = blurt.components.length;
    if (n === total) record(blurt.id, up(blurt.id), true);
    else if (n / total >= 0.6) record(blurt.id, Math.max(1, Math.min(3, profile.proficiency[blurt.id] ?? 1)), false);
    else record(blurt.id, 0, false);
    setBlurtPhase("done");
  }

  /* ---- ladder grading ---- */
  function gradeLadder() {
    const used = new Array(ladder.slots.length).fill(false);
    const matched = slotVals.map((txt) => {
      const t = norm(txt);
      if (!t) return -1;
      for (let i = 0; i < ladder.slots.length; i++) {
        if (used[i]) continue;
        if (ladder.slots[i].keywords.some((k) => t.includes(norm(k)))) { used[i] = true; return i; }
      }
      return -1;
    });
    setLResults({ matched, used });
    setLPhase("graded");
    const got = used.filter(Boolean).length;
    if (got === ladder.slots.length) record(ladder.id, up(ladder.id), true);
    else if (got >= Math.ceil(ladder.slots.length * 0.6)) record(ladder.id, Math.max(1, Math.min(3, profile.proficiency[ladder.id] ?? 1)), false);
    else record(ladder.id, 0, false);
  }
  function overrideSlot(i) {
    const nr = { ...lResults, used: [...lResults.used] };
    nr.used[i] = !nr.used[i];
    setLResults(nr);
    const got = nr.used.filter(Boolean).length;
    if (got === ladder.slots.length) bump(ladder.id);
    else if (got < Math.ceil(ladder.slots.length * 0.6)) setProf(ladder.id, 0);
  }

  /* ---- stats over the active pool ---- */
  const activePool = mode === "blurt" ? blurtPool : mode === "ladder" ? ladderPool : cardPool;
  const stats = useMemo(() => {
    let mastered = 0, learning = 0, pile = 0, fresh = 0;
    activePool.forEach((c) => {
      const p = profile.proficiency[c.id];
      if (p === undefined) fresh++;
      else if (p === 0) pile++;
      else if (p <= 3) learning++;
      else mastered++;
    });
    return { mastered, learning, pile, fresh };
  }, [activePool, profile]);

  const prof = card ? profile.proficiency[card.id] : undefined;
  const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  /* ================= render ================= */

  if (stage === "loading") return <div className="desk"><div className="loadmsg">Opening the pad…</div></div>;

  if (stage === "login")
    return (
      <div className="desk">
        <div className="loginwrap">
          <div className="folder">
            <div className="folder-tab">CASE FILE</div>
            <h1 className="brand">Black Letter</h1>
            <p className="tagline">Rule drilling, blank-page recall, and attack outlines for 1Ls.</p>
            <label className="loglabel" htmlFor="em">Email</label>
            <input id="em" className="login-input" value={emailInput} placeholder="you@school.edu"
              onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} autoComplete="email" />
            <button className="btn btn-ink" onClick={login}>Open my pad</button>
            <p className="fineprint">Progress is keyed to this email on this device. No password — don't store anything private.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="desk">

      <header className="topbar">
        <span className="brand-sm">Black Letter</span>
        <nav className="tabs">
          {[["drill", "Drill"], ["blurt", "Blurt"], ["ladder", "Ladder"], ["browse", "Browse"], ["attack", "Attack"], ["stats", "Progress"]].map(([k, label]) => (
            <button key={k} className={"tab " + (mode === k ? "tab-on" : "")} onClick={() => setMode(k)}>{label}</button>
          ))}
        </nav>
        <span className="whoami">{email} · <button className="linkbtn" onClick={() => { setStage("login"); setEmailInput(""); }}>switch</button></span>
      </header>

      <div className="subrow">
        <button className={"chip " + (subject === "mixed" ? "chip-on" : "")} onClick={() => setSubject("mixed")}>
          Mixed <span className="chip-note">interleaved</span>
        </button>
        {subjectKeys.map((k) => (
          <button key={k} className={"chip " + (subject === k ? "chip-on" : "")} onClick={() => setSubject(k)}>{db[k].name}</button>
        ))}
      </div>

      {mode !== "attack" && mode !== "stats" && mode !== "browse" && (
        <div className="statsrow">
          <span className="stat"><b>{stats.mastered}</b> mastered</span>
          <span className="stat"><b>{stats.learning}</b> learning</span>
          <span className="stat stat-red"><b>{stats.pile}</b> study pile</span>
          <span className="stat stat-dim"><b>{stats.fresh}</b> new</span>
        </div>
      )}

      {/* ================= DRILL ================= */}
      {mode === "drill" && (
        !card ? (
          <Pad empty><p className="empty-msg">No cards here yet.<br />Send an outline and this deck fills itself.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? db[card._s].name + " · " : ""}{card.concept}</span>
              <span className={"proftag " + (prof === 0 ? "proftag-red" : prof >= 4 ? "proftag-green" : "")}>{profLabel(prof)}</span>
            </div>

            {card.type === "flash" && tier === "front" && (
              <>
                <p className="prompt">{card.prompt}</p>
                <div className="btnrow">
                  <button className="btn btn-green" onClick={knowIt}>I know it</button>
                  <button className="btn btn-ink" onClick={needHelp}>Need help</button>
                </div>
              </>
            )}

            {tier === "fallback" && (
              <>
                {card.type === "flash" && <p className="prompt prompt-sm">{card.prompt}</p>}
                <ClozeLine parts={parseCloze(card.type === "cloze" ? card.text : card.fallback)}
                  values={clozeVals} setValues={setClozeVals} graded={false} results={[]} lineHeight="34px" />
                <div className="btnrow">
                  <button className="btn btn-ink" onClick={() => gradeCloze(card.type === "cloze" ? card.text : card.fallback)}>Check answers</button>
                </div>
                {card.type === "flash" && <p className="hintnote">Fill every blank. Wrong or empty sends this to the study pile.</p>}
              </>
            )}

            {card.type === "mcq" && tier !== "graded" && (
              <>
                <p className="prompt prompt-sm">{card.scenario}</p>
                <div className="mcqlist">
                  {card.options.map((o, i) => (
                    <button key={i} className="mcq" onClick={() => gradeMcq(i)}>
                      <span className="mcq-letter">{String.fromCharCode(65 + i)}</span> {o}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tier === "graded" && (
              <div className="gradedwrap">
                {stamp && <div className={"stamp " + (stamp.good ? "stamp-green" : "stamp-red")}>{stamp.text}</div>}

                {card.type === "mcq" && (
                  <>
                    <p className="prompt prompt-sm">{card.scenario}</p>
                    <div className="mcqlist">
                      {card.options.map((o, i) => (
                        <div key={i} className={"mcq mcq-done " + (i === card.correct ? "mcq-right" : i === mcqPick ? "mcq-wrong" : "")}>
                          <span className="mcq-letter">{String.fromCharCode(65 + i)}</span> {o}
                        </div>
                      ))}
                    </div>
                    <p className="explain">{card.explanation}</p>
                  </>
                )}

                {card.type !== "mcq" && revealed && (
                  <>
                    {clozeResults.length > 0 && (
                      <ClozeLine parts={parseCloze(card.type === "cloze" ? card.text : card.fallback)}
                        values={clozeVals} setValues={setClozeVals} graded={true} results={clozeResults} lineHeight="34px" />
                    )}
                    {card.type === "flash" && (
                      <div className="answerblock">
                        {(Array.isArray(card.answer) ? card.answer : [card.answer]).map((l, i) => (
                          <p key={i} className="answerline">{l}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {card.why && <p className="why"><span className="whylabel">Why it matters:</span> {card.why}</p>}

                <div className="btnrow">
                  <button className="btn btn-ink" onClick={() => dealCard(card.id)}>Next card</button>
                  {stamp && stamp.text === "KNOWN" && (
                    <button className="btn btn-demote" onClick={() => { setProf(card.id, 0); setStamp({ text: "STUDY PILE", good: false }); }}>
                      Actually missed it → study pile
                    </button>
                  )}
                </div>
              </div>
            )}
          </Pad>
        )
      )}

      {/* ================= BLURT ================= */}
      {mode === "blurt" && (
        !blurt ? (
          <Pad empty><p className="empty-msg">No blurt topics for this subject yet.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? db[blurt._s].name + " · " : ""}blank page</span>
              <span className={"proftag " + (profile.proficiency[blurt.id] === 0 ? "proftag-red" : profile.proficiency[blurt.id] >= 4 ? "proftag-green" : "")}>
                {profLabel(profile.proficiency[blurt.id])}
              </span>
            </div>

            <h2 className="blurt-topic">{blurt.topic}</h2>

            {blurtPhase === "write" && (
              <>
                <p className="hintnote hint-top">Notes closed. Write everything you can produce — rule statement, elements, exceptions, cases. Finish the whole blurt before checking.</p>
                <textarea className="blurtbox" value={blurtText} onChange={(e) => setBlurtText(e.target.value)}
                  placeholder="Write the rule from memory…" spellCheck="false" />
                <div className="btnrow">
                  {!running ? (
                    <button className="btn btn-green" onClick={() => setRunning(true)}>Start 5:00</button>
                  ) : (
                    <span className="timer">{mmss(secs)}</span>
                  )}
                  <button className="btn btn-ink" onClick={finishBlurt}>Done — show me the checklist</button>
                </div>
              </>
            )}

            {blurtPhase !== "write" && (
              <>
                <div className="yourblurt">
                  <div className="yb-label">What you wrote</div>
                  <pre className="yb-text">{blurtText || "(nothing)"}</pre>
                </div>

                <div className="checklist">
                  <div className="cl-label">Did you produce each of these? Be honest — this feeds the weighting.</div>
                  {blurt.components.map((c, i) => (
                    <button key={i} className={"clitem " + (hits[i] ? "clitem-on" : "")}
                      disabled={blurtPhase === "done"}
                      onClick={() => { const h = [...hits]; h[i] = !h[i]; setHits(h); }}>
                      <span className="clbox">{hits[i] ? "✓" : ""}</span> {c}
                    </button>
                  ))}
                  <div className="clscore">{hits.filter(Boolean).length} / {blurt.components.length}</div>
                </div>

                {blurtPhase === "score" && (
                  <div className="btnrow"><button className="btn btn-ink" onClick={commitBlurt}>Score it &amp; show the model</button></div>
                )}

                {blurtPhase === "done" && (
                  <>
                    <div className="model">
                      <div className="model-label">Model answer</div>
                      {blurt.model.map((l, i) => <p key={i} className="modelline">{l}</p>)}
                    </div>
                    <div className="btnrow">
                      <button className="btn btn-ink" onClick={() => dealBlurt(blurt.id)}>Next topic</button>
                      <button className="btn btn-green" onClick={() => { setBlurtText(""); setHits([]); setBlurtPhase("write"); setSecs(90); setRunning(true); }}>
                        Re-blurt this now (1:30)
                      </button>
                    </div>
                    <p className="hintnote">The re-blurt is the part most people skip — it confirms the patch actually took.</p>
                  </>
                )}
              </>
            )}
          </Pad>
        )
      )}

      {/* ================= LADDER ================= */}
      {mode === "ladder" && (
        !ladder ? (
          <Pad empty><p className="empty-msg">No ladders for this subject yet.</p></Pad>
        ) : (
          <Pad>
            <div className="cardmeta">
              <span className="concept">{subject === "mixed" ? db[ladder._s].name + " · " : ""}{ladder.concept}</span>
              <span className={"proftag " + (profile.proficiency[ladder.id] === 0 ? "proftag-red" : profile.proficiency[ladder.id] >= 4 ? "proftag-green" : "")}>
                {profLabel(profile.proficiency[ladder.id])}
              </span>
            </div>

            <p className="prompt prompt-sm">{ladder.prompt}</p>

            {lPhase === "count" && (
              <>
                <p className="hintnote hint-top">First: how many? Getting the count right is the scaffold that stops you producing three of four on an exam.</p>
                <div className="countrow">
                  <input className="countbox" value={countGuess} inputMode="numeric"
                    onChange={(e) => setCountGuess(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && countGuess && setLPhase("fill")} placeholder="#" />
                  <button className="btn btn-ink" disabled={!countGuess} onClick={() => setLPhase("fill")}>Lock it in</button>
                </div>
              </>
            )}

            {lPhase !== "count" && (
              <>
                <p className={"countverdict " + (Number(countGuess) === ladder.slots.length ? "cv-good" : "cv-bad")}>
                  You said {countGuess} — there are {ladder.slots.length}.
                </p>
                {ladder.slots.map((s, i) => (
                  <div key={i} className="slotrow">
                    <span className="slotnum">{i + 1}</span>
                    <input className={"slotbox " + (lPhase === "graded" ? (lResults.matched[i] >= 0 ? "slot-hit" : "slot-miss") : "")}
                      value={slotVals[i]} disabled={lPhase === "graded"}
                      onChange={(e) => { const v = [...slotVals]; v[i] = e.target.value; setSlotVals(v); }}
                      placeholder={"Element " + (i + 1)} />
                  </div>
                ))}

                {lPhase === "fill" && (
                  <div className="btnrow"><button className="btn btn-ink" onClick={gradeLadder}>Check</button></div>
                )}

                {lPhase === "graded" && (
                  <>
                    <div className="slotkey">
                      {ladder.slots.map((s, i) => (
                        <div key={i} className={"keyrow " + (lResults.used[i] ? "keyrow-hit" : "keyrow-miss")}>
                          <span className="keymark">{lResults.used[i] ? "✓" : "✗"}</span>
                          <span className="keylabel">{s.label}</span>
                          <button className="keytoggle" onClick={() => overrideSlot(i)}>
                            {lResults.used[i] ? "mark missed" : "I had this"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="btnrow"><button className="btn btn-ink" onClick={() => dealLadder(ladder.id)}>Next ladder</button></div>
                  </>
                )}
              </>
            )}
          </Pad>
        )
      )}

      {/* ================= BROWSE ================= */}
      {mode === "browse" && (
        <BrowseView db={db} subject={subject} subjectKeys={subjectKeys} proficiency={profile.proficiency} />
      )}

      {/* ================= PROGRESS ================= */}
      {mode === "stats" && (
        <StatsView db={db} subject={subject} subjectKeys={subjectKeys} profile={profile} setSubject={setSubject} />
      )}

      {/* ================= ATTACK OUTLINE ================= */}
      {mode === "attack" && (
        <div className="attackwrap">
          {(subject === "mixed" ? subjectKeys : [subject]).map((k) =>
            db[k].attack ? <AttackCard key={k} data={db[k].attack} /> : null
          )}
        </div>
      )}

      <p className="deskfoot">
        {mode === "drill" && "Weighted draw: study-pile items surface ~36× more often than mastered ones."}
        {mode === "blurt" && "Free recall beats review. Blurt → check → patch → re-blurt."}
        {mode === "ladder" && "Count first, then fill. Unordered grading — say it however you'd write it."}
        {mode === "browse" && "Read-only. Nothing here changes your proficiency."}
        {mode === "attack" && "This is the page you memorize. Blurt from these headings."}
        {mode === "stats" && "Accuracy counts every graded attempt; proficiency reflects where you stand now."}
      </p>
    </div>
  );
}
