import { useEffect, useRef, type ReactNode } from 'react';

type NotebookProps = {
  kind: 'evidence' | 'history' | 'chapters' | 'saves' | 'settings' | 'archive' | 'help' | 'characters' | 'pwa';
  title: string;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  children: ReactNode;
};

export function Notebook({ kind, title, onClose, returnFocusTo, children }: NotebookProps) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab' || !dialog.current) return;
      const controls = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )).filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose, returnFocusTo]);

  return (
    <>
      <div className="notebook-backdrop" aria-hidden="true" onClick={onClose} />
      <aside
        ref={dialog}
        className={`evidence-panel open notebook-dialog ${kind}-notebook ${kind === 'history' ? 'history-notebook' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notebook-title"
        tabIndex={-1}
      >
        <div className="panel-head">
          <div><small>CIRCUIT / {kind.toUpperCase()}</small><h2 id="notebook-title">{title}</h2></div>
          <button ref={closeButton} onClick={onClose} aria-label={`关闭${title}`}>×</button>
        </div>
        <div className="notebook-body">{children}</div>
      </aside>
    </>
  );
}
