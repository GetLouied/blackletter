/* Loads the decks at runtime from /data/*.json.

   To add a subject: drop a new JSON file in /data and register it in
   /data/manifest.json. No rebuild required — the app picks it up on reload. */

export async function loadDB() {
  const res = await fetch("./data/manifest.json", { cache: "no-cache" });
  const manifest = await res.json();

  const subjects = {};
  await Promise.all(
    manifest.subjects.map(async (s) => {
      const r = await fetch(s.file, { cache: "no-cache" });
      const d = await r.json();
      subjects[s.key] = {
        name: d.name || s.name,
        cards: d.cards || [],
        blurts: d.blurts || [],
        ladders: d.ladders || [],
        attack: d.attack || null,
      };
    })
  );

  return subjects;
}
