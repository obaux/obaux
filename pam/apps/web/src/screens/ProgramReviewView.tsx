"use client";

import * as stylex from "@stylexjs/stylex";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import { BellOutlineIcon } from "@pam/ui";
import { MenuList } from "@pam/ui/MenuList";
import { SetupArt } from "@pam/ui/SetupArt";
import { SubPage } from "@pam/ui/SubPage";
import { Confetti } from "@pam/ui/SuccessScreen";
import { useI18n } from "@/lib/i18n";

/**
 * Sent to Pam (Will, 7 October, D-379): a program a lead has just added,
 * while a super admin checks it. The hero template (D-376) with its own
 * celebratory picture; confetti the moment it is sent; and what happens
 * next as three steps, so the wait has a shape — sent, being checked,
 * live. One row: a text when it is live (Will: "Receive a text when ready,
 * which opens up the text message permission settings").
 *
 * It is also the Program tab until the program is approved, so Back goes
 * Home — the tab has nowhere else to go back to. Home no longer offers Add a
 * program (the card goes when the program is sent).
 */
const ICON = { width: 26, height: 26, "aria-hidden": true } as const;

const styles = stylex.create({
  body: { fontSize: "18px", lineHeight: 1.5 },
  // More room around the steps (Will, D-380).
  steps: { paddingInline: "8px", paddingBlock: "12px" },
  step: {
    fontSize: "17px",
    lineHeight: 1.45,
    minWidth: 0,
    paddingBottom: "22px",
  },
  lastStep: { paddingBottom: "0px" },
  // The marker and the line down to the next one: a progress flow.
  rail: {
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    width: "14px",
  },
  line: {
    width: "2px",
    flexGrow: 1,
    marginBlock: "4px",
    borderRadius: "1px",
    backgroundColor: colorVars["--color-border"],
  },
  lineDone: { backgroundColor: colorVars["--color-success"] },
  // A rule above "Text me when it's live", set apart from the steps.
  textRow: {
    width: "100%",
    paddingTop: "8px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colorVars["--color-border"],
  },
  later: { color: colorVars["--color-text-secondary"] },
  // The marker: done is filled green, now is a green ring, later is grey.
  mark: {
    width: "14px",
    height: "14px",
    marginTop: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: colorVars["--color-border"],
    boxSizing: "border-box",
  },
  done: {
    backgroundColor: colorVars["--color-success"],
    borderColor: colorVars["--color-success"],
  },
  now: { borderColor: colorVars["--color-success"] },
});

const STEPS = ["sent", "review", "live"] as const;

export function ProgramReviewView({
  isCelebrating = false,
}: { readonly isCelebrating?: boolean } = {}) {
  const { t } = useI18n();
  return (
    <SubPage
      title={t("programs.review.title")}
      backHref="/"
      backLabel={t("nav.back.home")}
      hero={<SetupArt kind="review" isHero />}
    >
      {isCelebrating ? <Confetti /> : null}
      <Text xstyle={styles.body}>{t("programs.review.body")}</Text>
      <VStack
        gap={0}
        role="list"
        aria-label={t("programs.review.stepsLabel")}
        xstyle={styles.steps}
      >
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <HStack
              key={step}
              gap={3}
              align="start"
              wrap="nowrap"
              role="listitem"
            >
              <VStack aria-hidden gap={0} xstyle={styles.rail}>
                <HStack
                  xstyle={[
                    styles.mark,
                    i === 0 && styles.done,
                    i === 1 && styles.now,
                  ]}
                />
                {/* The line to the next step: green once this one is done. */}
                {isLast ? null : (
                  <HStack xstyle={[styles.line, i === 0 && styles.lineDone]} />
                )}
              </VStack>
              <Text
                xstyle={[
                  styles.step,
                  i === 2 && styles.later,
                  isLast && styles.lastStep,
                ]}
              >
                {t(`programs.review.step.${step}`)}
              </Text>
            </HStack>
          );
        })}
      </VStack>
      <VStack xstyle={styles.textRow}>
        <MenuList
          label={t("programs.review.title")}
          items={[
            {
              id: "text-me",
              label: t("programs.review.text"),
              description: t("programs.review.text.body"),
              href: "/alerts/",
              icon: <BellOutlineIcon {...ICON} />,
            },
          ]}
        />
      </VStack>
    </SubPage>
  );
}
