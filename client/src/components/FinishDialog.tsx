import { useState } from "react";
import type { Work } from "../api/client";
import { DialogFrame } from "./DialogFrame";
import { Rating } from "./Rating";

/** Calling something finished: one last, optional question — the rating. */
export function FinishDialog({
  work,
  onConfirm,
  onCancel,
}: {
  work: Work;
  onConfirm: (rating: number | null) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);

  return (
    <DialogFrame titleId="finish-title" title={`¿Has terminado ${work.title}?`} onCancel={onCancel}>
      <p className="m-0 mb-3 text-[15px] text-ink-soft">¿Qué nota le das? (opcional)</p>
      <Rating value={rating} onChange={setRating} size={16} />

      <div className="mt-8 grid gap-3">
        <button type="button" onClick={() => onConfirm(rating)} className="btn w-full">
          Marcar como terminado
        </button>
        <button type="button" onClick={onCancel} className="link-quiet mt-1 justify-self-center">
          Cancelar
        </button>
      </div>
    </DialogFrame>
  );
}
