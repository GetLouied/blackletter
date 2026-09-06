import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.jsx";
import { loadDB } from "./data.js";

function Boot() {
  const [db, setDb] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    loadDB().then(setDb).catch((e) => setErr(String(e)));
  }, []);

  if (err) {
    return (
      <div className="desk">
        <div className="loadmsg">
          Couldn't load the decks.<br />
          {err}
        </div>
      </div>
    );
  }
  if (!db) return <div className="desk"><div className="loadmsg">Opening the pad…</div></div>;
  return <App db={db} />;
}

createRoot(document.getElementById("root")).render(<Boot />);
