import { useTheme } from "@emotion/react";
import { Link } from "@tanstack/react-router";

const DoneStep = () => {
  const theme = useTheme();

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 6: Post-Migration</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 1.5em" }}>
        All devices have been migrated. Complete the following steps to finish
        the setup.
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
            <strong>Update your .env file.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              Replace HUE_BRIDGE_ADDRESS, HUE_BRIDGE_USER, and
              HUE_BRIDGE_USER_CLIENT_KEY with the new hub credentials from Step 2.
              Restart HCC.
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
            <strong>Add the new Hue bridge to Apple Home.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              Open the Hue app &rarr; Settings &rarr; Voice Assistants &rarr; Apple
              Home &rarr; follow the setup. All devices will appear in HomeKit under
              &quot;Default Room&quot;.
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
            <strong>Assign HomeKit rooms manually.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              HomeKit room assignments are separate from Hue rooms. Open the Home
              app and move each accessory to the correct room. Since device names
              were preserved during migration, this should be straightforward.
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
            4.
          </span>
          <div>
            <strong>Power off the old hub.</strong>
            <p css={{ margin: "0.3em 0 0", color: theme.colors.text.muted }}>
              Once everything is working on the new hub, you can disconnect the
              old bridge.
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/"
        css={{
          display: "inline-block",
          padding: "12px 24px",
          fontSize: "1em",
          cursor: "pointer",
          backgroundColor: theme.colors.text.main,
          color: theme.colors.body,
          border: "none",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default DoneStep;
