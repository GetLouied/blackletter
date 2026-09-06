import { parseCloze } from "../helpers.js";

export function ClozeLine({ parts, values, setValues, graded, results, lineHeight }) {
  return (
    <div className="clozewrap" style={{ lineHeight }}>
      {parts.map((p, idx) =>
        p.t === "txt" ? (
          <span key={idx}>{p.v}</span>
        ) : (
          <span key={idx} className="blankspan">
            <input
              className={
                "blank " +
                (graded ? (results[p.i] ? "blank-right" : "blank-wrong") : "")
              }
              style={{ width: Math.max(70, p.v.length * 11) + "px" }}
              value={values[p.i] || ""}
              disabled={graded}
              onChange={(e) => {
                const nv = [...values];
                nv[p.i] = e.target.value;
                setValues(nv);
              }}
              placeholder="________"
              autoComplete="off"
            />
            {graded && !results[p.i] && (
              <span className="reveal"> {p.v} </span>
            )}
          </span>
        )
      )}
    </div>
  );
}

/* Read-only version: blanks already filled in, used by Browse. */
export function clozeFilled(text) {
  return parseCloze(text).map((p, i) =>
    p.t === "txt" ? <span key={i}>{p.v}</span> : <b key={i} className="fillword">{p.v}</b>
  );
}
