import { useTheme } from "@emotion/react";

type Props = {
  onNext: () => void;
};

const HomeKitPrepStep = ({ onNext }: Props) => {
  const theme = useTheme();

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 1: Prepare HomeKit</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 1.5em" }}>
        If your old Hue bridge is connected to Apple Home, follow these steps
        before migrating. If you don&apos;t use HomeKit, skip to the next step.
      </p>

      <div
        css={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: "1.5em",
        }}
      >
        <div css={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span
            css={{
              fontWeight: 700,
              fontSize: "1.1em",
              minWidth: 28,
              color: theme.colors.text.muted,
            }}
          >
            1.
          </span>
          <div>
            <strong>Remove the old Hue bridge from Apple Home.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              Open the Home app &rarr; tap the old bridge &rarr; Remove
              Accessory. This removes all its devices from HomeKit.
            </p>
          </div>
        </div>

        <div css={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span
            css={{
              fontWeight: 700,
              fontSize: "1.1em",
              minWidth: 28,
              color: theme.colors.text.muted,
            }}
          >
            2.
          </span>
          <div>
            <strong>Keep both hubs powered on and connected to your network.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              The migration tool will connect to both hubs simultaneously. Devices
              will be moved one by one from old to new.
            </p>
          </div>
        </div>

        <div css={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span
            css={{
              fontWeight: 700,
              fontSize: "1.1em",
              minWidth: 28,
              color: theme.colors.text.muted,
            }}
          >
            3.
          </span>
          <div>
            <strong>Do NOT add the new bridge to HomeKit yet.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              Wait until all devices are migrated and assigned to the correct
              rooms. You&apos;ll add the new bridge to HomeKit in the final step.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        css={{
          padding: "12px 24px",
          fontSize: "1em",
          cursor: "pointer",
          backgroundColor: theme.colors.text.main,
          color: theme.colors.body,
          border: "none",
          borderRadius: 6,
        }}
      >
        Next: Connect Hubs
      </button>
    </div>
  );
};

export default HomeKitPrepStep;
