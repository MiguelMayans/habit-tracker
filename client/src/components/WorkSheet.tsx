import { useState } from "react";
import type { Work, WorkFields, WorkKind, WorkStatus } from "../api/client";
import { KIND_LABEL, PROGRESS_HINT, WORK_KINDS } from "../lib/works";
import { DialogFrame } from "./DialogFrame";
import { Rating } from "./Rating";
import { WorkKindIcon } from "./WorkIcons";

const STATUSES: { status: WorkStatus; label: string }[] = [
  { status: "active", label: "En curso" },
  { status: "queued", label: "Recámara" },
  { status: "done", label: "Terminado" },
];

/**
 * Adding to the Lair, or editing something already in it: kind, title, where
 * it stands, and a free line of progress. The rating only appears once it is
 * finished — rating something halfway through is a different question.
 */
export function WorkSheet({
  work,
  initialKind,
  busy,
  error,
  onSave,
  onDelete,
  onCancel,
}: {
  /** Null to add a new one. */
  work: Work | null;
  /** For a new one: the kind the filter was on, so it starts there. */
  initialKind?: WorkKind;
  busy: boolean;
  error: string | null;
  onSave: (fields: WorkFields & { kind: WorkKind; title: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<WorkKind>(work?.kind ?? initialKind ?? "game");
  const [title, setTitle] = useState(work?.title ?? "");
  const [status, setStatus] = useState<WorkStatus>(work?.status ?? "active");
  const [progress, setProgress] = useState(work?.progress ?? "");
  const [rating, setRating] = useState<number | null>(work?.rating ?? null);

  return (
    <DialogFrame
      titleId="work-sheet-title"
      bandTitle={work ? "Editar" : "A la guarida"}
      band="var(--color-mente)"
      onCancel={onCancel}
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            kind,
            title,
            status,
            progress,
            rating: status === "done" ? rating : null,
          });
        }}
      >
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2.5">
            {WORK_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="icon-pick"
                aria-pressed={kind === k}
                aria-label={KIND_LABEL[k].one}
                onClick={() => setKind(k)}
                style={{ "--accent": "var(--color-bone)" } as React.CSSProperties}
              >
                <WorkKindIcon kind={k} className="h-5 w-5" />
              </button>
            ))}
          </div>
          <p className="m-0 text-[10px] font-bold tracking-[0.14em] text-bone/75 uppercase">
            {KIND_LABEL[kind].one}
          </p>
        </div>

        <div className="field-frame">
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            aria-label="Título"
            maxLength={200}
            autoFocus={!work}
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {STATUSES.map((s) => (
            <button
              key={s.status}
              type="button"
              className="option-chip"
              aria-pressed={status === s.status}
              onClick={() => setStatus(s.status)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {status === "done" ? (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.14em] text-bone/75">
              NOTA
            </span>
            <Rating value={rating} onChange={setRating} size={15} />
          </div>
        ) : (
          <div className="field-frame">
            <input
              className="field"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder={`Progreso: ${PROGRESS_HINT[kind]}`}
              aria-label="Progreso"
              maxLength={80}
            />
          </div>
        )}

        {error && (
          <p className="anim-slam m-0 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || title.trim() === ""}
          className="slam-button mt-1 w-full"
        >
          <span>{busy ? "Guardando…" : work ? "Guardar" : "Añadir"}</span>
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="slam-button w-full"
            style={{
              background: "var(--color-cuerpo)",
              color: "var(--color-bone)",
            }}
          >
            <span>Borrar</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-1 text-[10px] font-bold tracking-[0.16em] text-bone/60 underline"
        >
          CANCELAR
        </button>
      </form>
    </DialogFrame>
  );
}
