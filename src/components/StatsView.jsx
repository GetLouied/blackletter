export function Bar({ counts }) {
  const total = counts.mastered + counts.learning + counts.pile + counts.fresh || 1;
  const pct = (n) => (n / total) * 100 + "%";
  return (
    <div className="bar">
      <div className="seg seg-mast" style={{ width: pct(counts.mastered) }} />
      <div className="seg seg-learn" style={{ width: pct(counts.learning) }} />
      <div className="seg seg-pile" style={{ width: pct(counts.pile) }} />
      <div className="seg seg-new" style={{ width: pct(counts.fresh) }} />
    </div>
  );
}

function countFor(items, proficiency) {
  let mastered = 0, learning = 0, pile = 0, fresh = 0;
  items.forEach((i) => {
    const p = proficiency[i.id];
    if (p === undefined) fresh++;
    else if (p === 0) pile++;
    else if (p <= 3) learning++;
    else mastered++;
  });
  return { mastered, learning, pile, fresh, total: items.length };
}

export function StatsView({ db, subject, subjectKeys, profile, setSubject }) {
  const proficiency = profile.proficiency || {};
  const attempts = profile.stats || {};
  const days = profile.days || {};
  const keys = subject === "mixed" ? subjectKeys : [subject];

  const itemsFor = (k) => [
    ...db[k].cards.map((c) => ({ ...c, _kind: "card", _s: k, _t: c.concept })),
    ...(db[k].blurts || []).map((b) => ({ ...b, _kind: "blurt", _s: k, _t: b.topic })),
    ...(db[k].ladders || []).map((l) => ({ ...l, _kind: "ladder", _s: k, _t: l.concept })),
  ];
  const all = keys.flatMap(itemsFor);
  const overall = countFor(all, proficiency);

  let seen = 0, right = 0;
  all.forEach((i) => { const a = attempts[i.id]; if (a) { seen += a.seen; right += a.right; } });
  const acc = seen ? Math.round((right / seen) * 100) : null;

  /* last 14 days of activity */
  const dayList = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    dayList.push({ k, n: days[k] || 0, label: d.getDate() });
  }
  const peak = Math.max(1, ...dayList.map((d) => d.n));

  /* streak of consecutive days ending today */
  let streak = 0;
  for (let i = dayList.length - 1; i >= 0; i--) { if (dayList[i].n > 0) streak++; else break; }

  /* weakest — study pile, most-attempted first */
  const weakest = all
    .filter((i) => proficiency[i.id] === 0)
    .sort((a, b) => ((attempts[b.id] || {}).seen || 0) - ((attempts[a.id] || {}).seen || 0))
    .slice(0, 12);

  const untouched = all.filter((i) => proficiency[i.id] === undefined).length;

  return (
    <div className="attackwrap">
      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Where you stand</h2>

          <div className="bignums">
            <div className="bignum"><b>{overall.mastered}</b><span>mastered</span></div>
            <div className="bignum"><b>{overall.learning}</b><span>learning</span></div>
            <div className="bignum bn-red"><b>{overall.pile}</b><span>study pile</span></div>
            <div className="bignum bn-dim"><b>{untouched}</b><span>untouched</span></div>
          </div>

          <Bar counts={overall} />
          <div className="legend">
            <span><i className="sw seg-mast" /> mastered</span>
            <span><i className="sw seg-learn" /> learning</span>
            <span><i className="sw seg-pile" /> study pile</span>
            <span><i className="sw seg-new" /> not yet seen</span>
          </div>

          <div className="metricrow">
            <div className="metric"><b>{acc === null ? "—" : acc + "%"}</b><span>accuracy over {seen} graded attempts</span></div>
            <div className="metric"><b>{streak}</b><span>day{streak === 1 ? "" : "s"} in a row</span></div>
          </div>
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Last 14 days</h2>
          <div className="spark">
            {dayList.map((d, i) => (
              <div className="sparkcol" key={i}>
                <div className="sparkbar" style={{ height: Math.max(3, (d.n / peak) * 88) + "px" }} title={d.n + " attempts"} />
                <span className="sparklabel">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="hintnote">Bars are graded attempts per day. Short daily sessions beat long weekly ones.</p>
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">By subject</h2>
          {subjectKeys.map((k) => {
            const c = countFor(itemsFor(k), proficiency);
            const pct = c.total ? Math.round((c.mastered / c.total) * 100) : 0;
            return (
              <div className="subjrow" key={k}>
                <div className="subjhead">
                  <button className="subjname" onClick={() => setSubject(k)}>{db[k].name}</button>
                  <span className="subjpct">{pct}% mastered · {c.total} items</span>
                </div>
                <Bar counts={c} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="pad attack-pad">
        <div className="pad-binding" />
        <div className="pad-inner">
          <h2 className="attack-title">Work on these next</h2>
          {weakest.length === 0 ? (
            <p className="empty-msg2">Nothing in the study pile{subject === "mixed" ? "" : " for " + db[subject].name}. Either you're in good shape or you haven't been honest with the demote button.</p>
          ) : (
            weakest.map((i) => {
              const a = attempts[i.id] || { seen: 0, right: 0 };
              return (
                <div className="weakrow" key={i.id}>
                  <span className="weakkind">{i._kind}</span>
                  <span className="weakname">{i._t}</span>
                  <span className="weakstat">{a.right}/{a.seen}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
