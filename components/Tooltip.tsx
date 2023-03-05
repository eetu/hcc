import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import classNames from "classnames";
import React, { useState } from "react";

import styles from "../styles/tooltip.module.css";

type TooltipProps = {
  className?: string;
  children?: React.ReactNode;
  content?: React.ReactNode;
};

const Tooltip: React.FC<TooltipProps> = ({ className, children, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        className={classNames(className)}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={refs.setFloating}
          className={styles.tooltip}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            visibility: x == null ? "hidden" : "visible",
          }}
          {...getFloatingProps()}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;
