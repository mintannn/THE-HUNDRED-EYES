"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Icon from "./Icon";

export default function Modal({ title, className = "", children, onClose }: { title: string; className?: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  const outside = (x: number, y: number) => {
    const rect = dialog.current?.getBoundingClientRect();
    return !!rect && (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom);
  };
  return (
    <dialog
      ref={dialog} className={`art-dialog ${className}`} aria-label={title}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onPointerDown={(e) => { pressedBackdrop.current = e.target === e.currentTarget && outside(e.clientX, e.clientY); }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget && outside(e.clientX, e.clientY)) onClose();
        pressedBackdrop.current = false;
      }}
    >
      <button className="dialog-close icon-button" onClick={onClose} aria-label="閉じる"><Icon name="close" /></button>
      <div className="dialog-scroll" tabIndex={0} role="region" aria-label={`${title}の一覧`}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== "Home" && e.key !== "End")) return;
          e.preventDefault();
          // Explicit bounds also cancel residual touch/keyboard scrolling.
          e.currentTarget.scrollTo({ top: e.key === "Home" ? 0 : e.currentTarget.scrollHeight, behavior: "instant" });
        }}
      >
        <div className="dialog-surface">{children}</div>
      </div>
    </dialog>
  );
}
