/** Simple modal dialog with a message and a set of choices. */
export default function Dialog({ title, message, options, onChoose }) {
  return (
    <div className="overlay" role="presentation" onClick={() => onChoose('cancel')}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="dlg-actions">
          {options.map((o) => (
            <button key={o.value} type="button" className={o.primary ? 'primary' : o.danger ? 'danger' : 'sec'} onClick={() => onChoose(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
