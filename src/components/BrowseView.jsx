import { useState } from "react";
import { clozeFilled } from "./ClozeLine.jsx";

function BrowseItem({ item, kind, prof }) {
  const [open, setOpen] = useState(false);
  const title =
    kind === "blurt" ? item.topic :
    kind === "ladder" ? item.concept :
    item.concept;
  return (
    <div className="bitem">
      <button className="bhead" onClick={() => setOpen(!open)}>
        <span className="bcaret">{open ? "▾" : "▸"}</span>
        <span className="btitle">{title}</span>
        <span className={"bdot " + (prof === undefined ? "d-new" : prof === 0 ? "d-pile" : prof <= 3 ? "d-learn" : "d-mast")} />
      </button>

      {open && (
        <div className="bbody">
          {kind === "card" && item.type === "cloze" && (
            <p className="bline">{clozeFilled(item.text)}</p>
          )}

          {kind === "card" && item.type === "flash" && (
            <>
              <p className="bq">{item.prompt}</p>
              {(Array.isArray(item.answer) ? item.answer : [item.answer]).map((l, i) => (
                <p key={i} className="bline">{l}</p>
              ))}
            </>
          )}

          {kind === "card" && item.type === "mcq" && (
            <>
              <p className="bq">{item.scenario}</p>
              {item.options.map((o, i) => (
                <p key={i} className={"bopt " + (i === item.correct ? "bopt-right" : "")}>
                  {String.fromCharCode(65 + i)}. {o}
                </p>
              ))}
              <p className="bline">{item.explanation}</p>
            </>
          )}

          {kind === "blurt" && (
            <>
              <p className="bq">Should contain:</p>
              <ul className="blist">{item.components.map((c, i) => <li key={i}>{c}</li>)}</ul>
              {item.model.map((l, i) => <p key={i} className="bline">{l}</p>)}
            </>
          )}

          {kind === "ladder" && (
            <>
              <p className="bq">{item.prompt}</p>
              <ol className="blist">{item.slots.map((s, i) => <li key={i}>{s.label}</li>)}</ol>
            </>
          )}

          {item.why && <p className="bwhy"><span className="whylabel">Why it matters:</span> {item.why}</p>}
        </div>
      )}
    </div>
  );
}

export function BrowseView({ db, subject, subjectKeys, proficiency }) {
  const [filter, setFilter] = useState("all");
  const keys = subject === "mixed" ? subjectKeys : [subject];

  const keep = (id) => {
    const p = proficiency[id];
    if (filter === "all") return true;
    if (filter === "pile") return p === 0;
    if (filter === "unmastered") return p === undefined || p < 4;
    return true;
  };

  return (
    <div className="attackwrap">
      <div className="filterrow">
        {[["all", "Everything"], ["unmastered", "Not yet mastered"], ["pile", "Study pile only"]].map(([k, l]) => (
          <button key={k} className={"fchip " + (filter === k ? "fchip-on" : "")} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {keys.map((k) => {
        const cards = db[k].cards.filter((c) => keep(c.id));
        const blurts = (db[k].blurts || []).filter((b) => keep(b.id));
        const ladders = (db[k].ladders || []).filter((l) => keep(l.id));
        if (!cards.length && !blurts.length && !ladders.length) return null;
        return (
          <div className="pad attack-pad" key={k}>
            <div className="pad-binding" />
            <div className="pad-inner">
              <h2 className="attack-title">{db[k].name}</h2>

              {blurts.length > 0 && (
                <>
                  <div className="bgroup">Blurt topics · {blurts.length}</div>
                  {blurts.map((b) => <BrowseItem key={b.id} item={b} kind="blurt" prof={proficiency[b.id]} />)}
                </>
              )}

              {ladders.length > 0 && (
                <>
                  <div className="bgroup">Element ladders · {ladders.length}</div>
                  {ladders.map((l) => <BrowseItem key={l.id} item={l} kind="ladder" prof={proficiency[l.id]} />)}
                </>
              )}

              {cards.length > 0 && (
                <>
                  <div className="bgroup">Cards · {cards.length}</div>
                  {cards.map((c) => <BrowseItem key={c.id} item={c} kind="card" prof={proficiency[c.id]} />)}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- progress ---------- */
