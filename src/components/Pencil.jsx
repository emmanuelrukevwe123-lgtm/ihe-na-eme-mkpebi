export default function Pencil() {
  return (
    <svg className="desk-pencil" viewBox="0 0 420 90" aria-hidden="true" focusable="false">
      <g filter="url(#rough)" strokeLinejoin="round" strokeLinecap="round">
        <path className="pencil-scribble" d="M392 52 c 6 10, -4 20, 6 26 s 14 -8, 22 -2" fill="none" />
        <path className="pencil-eraser" d="M40 18 L 14 18 C 2 18, 2 60, 14 60 L 40 60 Z" />
        <path className="pencil-ferrule" d="M40 16 L 72 16 L 72 62 L 40 62 Z" />
        <path className="pencil-line" d="M50 16 L 50 62 M 58 16 L 58 62 M 66 16 L 66 62" fill="none" />
        <path className="pencil-body" d="M72 18 L 312 18 L 312 60 L 72 60 Z" />
        <path className="pencil-facet" d="M72 32 L 312 32 M 72 46 L 312 46" fill="none" />
        <path className="pencil-wood" d="M312 18 L 372 36 C 376 38, 376 40, 372 42 L 312 60 Z" />
        <path className="pencil-lead" d="M358 32 L 386 39 L 358 46 Z" />
        <path className="pencil-shade" d="M320 26 l 10 8 M 318 40 l 12 6 M 326 50 l 8 -4" fill="none" />
      </g>
    </svg>
  );
}
