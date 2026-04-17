import { css, useTheme } from "@emotion/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import AssignStep from "../components/migrate/AssignStep";
import ConnectStep from "../components/migrate/ConnectStep";
import DoneStep from "../components/migrate/DoneStep";
import ExportStep from "../components/migrate/ExportStep";
import HomeKitPrepStep from "../components/migrate/HomeKitPrepStep";
import RoomsStep from "../components/migrate/RoomsStep";

type Step = "homekit-prep" | "connect" | "export" | "rooms" | "assign" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "homekit-prep", label: "1. HomeKit" },
  { id: "connect", label: "2. Connect" },
  { id: "export", label: "3. Export" },
  { id: "rooms", label: "4. Rooms" },
  { id: "assign", label: "5. Assign" },
  { id: "done", label: "6. Done" },
];

const MigratePage = () => {
  const theme = useTheme();
  const [step, setStep] = useState<Step>("homekit-prep");

  return (
    <div
      css={{
        width: "100%",
        maxWidth: 900,
        padding: "2em 1em",
      }}
    >
      <div
        css={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5em",
        }}
      >
        <h1 css={{ margin: 0, fontSize: "1.4em" }}>Hub Migration</h1>
        <Link
          to="/"
          css={css({
            fontSize: "0.9em",
            color: theme.colors.text.muted,
            textDecoration: "underline",
          })}
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Step indicator */}
      <div
        css={{
          display: "flex",
          gap: 4,
          marginBottom: "2em",
          flexWrap: "wrap",
        }}
      >
        {STEPS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setStep(id)}
            css={css({
              padding: "8px 16px",
              fontSize: "0.85em",
              cursor: "pointer",
              backgroundColor:
                step === id ? theme.colors.text.main : "transparent",
              color: step === id ? theme.colors.body : theme.colors.text.muted,
              border: `1px solid ${step === id ? theme.colors.text.main : theme.colors.text.muted}40`,
              borderRadius: 4,
              transition: "all 0.15s",
            })}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div
        css={{
          backgroundColor: theme.colors.background.main,
          boxShadow: theme.shadows.main,
          borderRadius: 6,
          padding: "1.5em",
          minHeight: 300,
        }}
      >
        {step === "homekit-prep" && (
          <HomeKitPrepStep onNext={() => setStep("connect")} />
        )}
        {step === "connect" && (
          <ConnectStep onNext={() => setStep("export")} />
        )}
        {step === "export" && (
          <ExportStep onNext={() => setStep("rooms")} />
        )}
        {step === "rooms" && (
          <RoomsStep onNext={() => setStep("assign")} />
        )}
        {step === "assign" && <AssignStep />}
        {step === "done" && <DoneStep />}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/migrate")({
  component: MigratePage,
});
