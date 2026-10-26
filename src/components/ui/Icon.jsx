/** Small inline SVG icon set (24x24, stroke based) used instead of emoji throughout the controls. */
const PATHS = {
  grip: <><circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /><path d="M3 3l18 18" /></>,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  flipH: <><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" /><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" /><path d="M12 2v2M12 8v2M12 14v2M12 20v2" /></>,
  flipV: <><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" /><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" /><path d="M2 12h2M8 12h2M14 12h2M20 12h2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  type: <><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  replace: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  download: <><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></>,
  code: <><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h7V3" /><path d="M8 21v-7h8v7" /></>,
  upload: <><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /></>,
  palette: <><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" /></>,
};

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`ic ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** Icon-only button (used in card headers). */
export function IconButton({ name, title, onClick, size = 16 }) {
  return (
    <button type="button" className="ib" title={title} aria-label={title} onClick={onClick}>
      <Icon name={name} size={size} />
    </button>
  );
}
