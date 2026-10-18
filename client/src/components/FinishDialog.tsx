import { useState } from "react";
import type { Work } from "../api/client";
import { DialogFrame } from "./DialogFrame";
import { Rating } from "./Rating";

/** Calling something finished: one last question, the rating, and done. */
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
    <DialogFrame
      titleId="finish-title"
      bandTitle="¿Completado?"
      band="var(--color-yellow)"
      onCancel={onCancel}
    >
      <p className="m-0 font-display text-[20px] leading-tight text-bone uppercase">
        {work.title}
      </p>
      <p className="mt-4 mb-2 text-[10px] font-bold tracking-[0.14em] text-bone/75">
        ¿QUÉ NOTA LE DAS? (OPCIONAL)
      </p>
      <Rating value={rating} onChange={setRating} size={18} />

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => onConfirm(rating)}
          className="slam-button w-full"
        >
          <span>A la vitrina</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-1 text-[10px] font-bold tracking-[0.16em] text-bone/60 underline"
        >
          CANCELAR
        </button>
      </div>
    </DialogFrame>
  );
}
