import { useState } from "react";
import type { Work, WorkFields, WorkKind, WorkStatus } from "../api/client";
import { KIND_COLOR, KIND_LABEL, PROGRESS_HINT, WORK_KINDS } from "../lib/works";
import { DialogFrame } from "./DialogFrame";
import { Rating } from "./Rating";
import { WorkKindIcon } from "./WorkIcons";

const STATUSES: { status: WorkStatus; label: string }[] = [
  { status: "active", label: "En curso" },
  { status: "queued", label: "Para después" },
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
  const [percent, setPercent] = useState<number | null>(work?.percent ?? null);
  const [rating, setRating] = useState<number | null>(work?.rating ?? null);

  return (
    <DialogFrame
      titleId="work-sheet-title"
      title={work ? "Editar" : "Añadir al refugio"}
      onCancel={onCancel}
    >
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            kind,
            title,
            status,
            progress,
            percent,
            rating: status === "done" ? rating : null,
          });
        }}
      >
        <div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo">
            {WORK_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                className="kind-pick"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                style={{ "--accent": KIND_COLOR[k] } as React.CSSProperties}
              >
                <WorkKindIcon kind={k} className="h-6 w-6" />
                {KIND_LABEL[k].many}
              </button>
            ))}
          </div>
        </div>

        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          aria-label="Título"
          maxLength={200}
          autoFocus={!work}
        />

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estado">
          {STATUSES.map((s) => (
            <button
              key={s.status}
              type="button"
              role="radio"
              className="chip"
              aria-checked={status === s.status}
              onClick={() => setStatus(s.status)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {status === "done" ? (
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-ink-soft">Nota</span>
            <Rating value={rating} onChange={setRating} size={14} />
          </div>
        ) : (
          <>
            <input
              className="field"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder={`Por dónde vas (opcional): ${PROGRESS_HINT[kind]}`}
              aria-label="Progreso"
              maxLength={80}
            />
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="field-label m-0">Cuánto llevas</span>
                <span className="text-[14px] font-semibold tabular-nums">
                  {percent === null ? (
                    <span className="font-normal text-ink-faint">sin marcar</span>
                  ) : (
                    <>
                      {percent} %
                      <button
                        type="button"
                        onClick={() => setPercent(null)}
                        className="link-quiet ml-3 text-[13px]"
                      >
                        Quitar
                      </button>
                    </>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percent ?? 0}
                onChange={(e) => setPercent(Number(e.target.value))}
                aria-label="Porcentaje"
                className="range"
                style={{ "--value": `${percent ?? 0}%` } as React.CSSProperties}
              />
            </div>
          </>
        )}

        {error && <p className="m-0 text-[14px] text-warn">{error}</p>}

        <div className="mt-2 grid gap-3">
          <button
            type="submit"
            disabled={busy || title.trim() === ""}
            className="btn w-full"
          >
            {busy ? "Guardando…" : work ? "Guardar" : "Añadir"}
          </button>

          {onDelete && (
            <button type="button" onClick={onDelete} className="btn btn-danger w-full">
              Borrar
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="link-quiet mt-1 justify-self-center"
          >
            Cancelar
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}
