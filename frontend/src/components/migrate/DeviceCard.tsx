import { css, useTheme } from "@emotion/react";

type Props = {
  name: string;
  productName?: string;
  modelId?: string;
  serviceTypes: string[];
  selected?: boolean;
  assigned?: boolean;
  assignedTo?: string;
  matchHint?: boolean;
  onClick?: () => void;
  onIdentify?: () => void;
  onMove?: () => void;
  moveLabel?: string;
};

const DeviceCard = ({
  name,
  productName,
  serviceTypes,
  selected,
  assigned,
  assignedTo,
  matchHint,
  onClick,
  onIdentify,
  onMove,
  moveLabel,
}: Props) => {
  const theme = useTheme();

  const smallBtnCss = css({
    padding: "6px 12px",
    fontSize: "0.8em",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: `1px solid ${theme.colors.text.muted}`,
    borderRadius: 4,
    color: theme.colors.text.main,
    whiteSpace: "nowrap",
    flexShrink: 0,
    "&:hover": {
      backgroundColor: `${theme.colors.text.main}10`,
    },
  });

  return (
    <div
      onClick={onClick}
      css={css({
        padding: "10px 14px",
        borderRadius: 6,
        border: selected
          ? `2px solid ${theme.colors.text.main}`
          : assigned
            ? "2px solid #27ae60"
            : matchHint
              ? "2px dashed #f39c12"
              : `1px solid ${theme.colors.text.muted}40`,
        backgroundColor: assigned ? "#27ae6015" : "transparent",
        cursor: onClick ? "pointer" : "default",
        opacity: assigned && !selected ? 0.6 : 1,
        transition: "border-color 0.15s, opacity 0.15s",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      })}
    >
      <div css={{ minWidth: 0, flex: 1 }}>
        <div css={{ fontWeight: 600, fontSize: "0.95em" }}>{name}</div>
        {productName && (
          <div css={{ fontSize: "0.8em", color: theme.colors.text.muted }}>
            {productName}
          </div>
        )}
        <div css={{ fontSize: "0.75em", color: theme.colors.text.muted }}>
          {serviceTypes.join(", ")}
        </div>
        {assignedTo && (
          <div css={{ fontSize: "0.8em", color: "#27ae60", marginTop: 2 }}>
            Assigned to: {assignedTo}
          </div>
        )}
      </div>
      <div css={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {onMove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
            css={css(smallBtnCss, {
              borderColor: "#e74c3c80",
              color: "#e74c3c",
            })}
          >
            {moveLabel ?? "Move"}
          </button>
        )}
        {onIdentify && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIdentify();
            }}
            css={smallBtnCss}
          >
            Flash
          </button>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;
