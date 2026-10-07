'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { BookIcon, SignedIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { usePolicies } from '@/lib/usePolicies';
import { HelpButton } from './HelpButton';

/**
 * Which of the program's policies this member has signed (D-324, Will,
 * 6 October): "a Policies signed item in their profile which is more
 * clearly visible for program leads, which opens up an individual page,
 * like the page members see when all policies are signed. If not all are
 * signed, create an alert on top saying {first name} needs to finish
 * signing on their device."
 *
 * The same list a member sees of their own signatures (D-270), read from
 * the program's side: each policy, signed on a day or not yet. Signing is
 * the member's act, on their own phone, so there is nothing here to tap
 * into — the alert says what is left and whose move it is.
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  progress: { fontSize: '17px', fontWeight: 600 },
  signedIcon: { color: 'var(--color-success)' },
  empty: { fontSize: '17px' },
});

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

export function PersonPoliciesView({ personId, firstName }: { readonly personId: string; readonly firstName: string }) {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const day = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' });
  const rows = policies.map((policy) => ({
    policy,
    signedAt: policy.signedBy.find((s) => s.personId === personId)?.signedAt ?? null,
  }));
  const signed = rows.filter((r) => r.signedAt).length;
  const total = rows.length;

  return (
    <SubPage
      title={t('person.policies.title')}
      subtitle={firstName}
      backHref={`/person/?id=${encodeURIComponent(personId)}`}
      backLabel={t('nav.back.person', { name: firstName })}
      actions={<HelpButton />}
    >
      {total === 0 ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('person.policies.none')}
        </Text>
      ) : (
        <>
          {signed < total ? (
            // Whose move it is, first (Will, D-324): the program cannot sign
            // for them, and should not have to work that out from the list.
            <Banner
              status="warning"
              title={t('person.policies.unfinished.title', { name: firstName })}
              description={t('person.policies.unfinished.body', { name: firstName, left: total - signed })}
            />
          ) : null}
          <Text type="supporting" xstyle={styles.intro}>
            {t('person.policies.intro', { name: firstName })}
          </Text>
          <Text xstyle={styles.progress}>{t('memberPolicies.progress', { signed, total })}</Text>
          <MenuList
            label={t('person.policies.title')}
            hasDividers
            items={rows.map(({ policy, signedAt }) => ({
              id: policy.id,
              label: policy.title,
              description: signedAt
                ? t('memberPolicies.signedOn', { date: day.format(new Date(signedAt)) })
                : t('person.policies.notYet'),
              icon: signedAt ? <SignedIcon {...ICON} {...stylex.props(styles.signedIcon)} /> : <BookIcon {...ICON} />,
            }))}
          />
        </>
      )}
    </SubPage>
  );
}
