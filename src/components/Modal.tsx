import { useEffect, useId, useRef, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value?: string) => void;
  mode?: "confirm" | "date" | "password" | "text";
  minDate?: string;
  initialDate?: string;
  placeholder?: string;
};

export function Modal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
  mode = "confirm",
  minDate,
  initialDate,
  placeholder,
}: Props) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === "date") {
        setValue(initialDate || minDate || "");
      } else {
        setValue("");
      }
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open, mode, minDate, initialDate]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={inputId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={inputId}>{title}</h3>
        {message ? <p>{message}</p> : null}
        {mode === "date" && (
          <input
            ref={inputRef}
            type="date"
            value={value}
            min={minDate}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {mode === "password" && (
          <input
            ref={inputRef}
            type="password"
            value={value}
            placeholder="Admin password"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm(value);
            }}
          />
        )}
        {mode === "text" && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder || "First name"}
            autoComplete="given-name"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm(value);
            }}
          />
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-host"
            onClick={() => onConfirm(mode === "confirm" ? undefined : value)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
