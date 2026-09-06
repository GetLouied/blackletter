export function Pad({ children, empty }) {
  return (
    <div className={"pad " + (empty ? "pad-empty" : "")}>
      <div className="pad-binding" />
      <div className="pad-inner">{children}</div>
    </div>
  );
}
