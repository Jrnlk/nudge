const COLORS = ["#2D5BFF", "#1DB07E", "#E5346F", "#F28C28", "#7B5CFF", "#0FA3B1", "#D9A400"];

/** Letter tile with a color picked from the name. Swap for logo uploads later. */
export function Avatar({ name }: { name: string }) {
  let n = 0;
  for (const ch of name) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className="row-span-3 grid size-[42px] place-items-center rounded-tile text-[17px] font-extrabold text-white"
      style={{ background: COLORS[n % COLORS.length] }}
    >
      {(name.charAt(0) || "?").toUpperCase()}
    </span>
  );
}
