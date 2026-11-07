import type { ReactNode } from "react";

/**
 * A panel that grows open to its own height and folds closed (the CSS lives
 * in `.fold`). Closed, its contents stay mounted but `inert`: out of the
 * tab order and away from screen readers.
 */
export function Collapse({
  open,
  children,
  id,
}: {
  open: boolean;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="fold" data-open={open} inert={!open}>
      <div>{children}</div>
    </div>
  );
}
