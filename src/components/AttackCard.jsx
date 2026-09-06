import { useState } from "react";

export function AttackCard({ data }) {
  const [open, setOpen] = useState({});
  return (
    <div className="pad attack-pad">
      <div className="pad-binding" />
      <div className="pad-inner">
        <h2 className="attack-title">{data.title}</h2>
        {data.sections.map((s, i) => {
          const isOpen = open[i] !== false;
          return (
            <div key={i} className="asec">
              <button className="ahead" onClick={() => setOpen({ ...open, [i]: !isOpen })}>
                <span className="acaret">{isOpen ? "▾" : "▸"}</span> {s.h}
              </button>
              {isOpen && (
                <ul className="alist">
                  {s.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ---------- browse (read-only) ---------- */
