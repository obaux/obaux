import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/*
 * A comparison: one row per thing, one column per kind of person. On a screen wide
 * enough it is a table; below 720px each row becomes a card with a line per column,
 * because a table of sentences scrolls sideways on a phone and that is the hardest
 * thing to read (D-433). Both are in the page and CSS shows one; the hidden one is
 * `display: none`, so a screen reader reads it once.
 */
const styles = stylex.create({
  wide: { display: { default: 'block', '@media (max-width: 719px)': 'none' } },
  narrow: { display: { default: 'none', '@media (max-width: 719px)': 'flex' } },
  yes: { fontWeight: 700 },
});

export interface CompareRow {
  readonly label: string;
  /** One cell per column, in order. A leading "Yes" or "No" is shown in bold. */
  readonly cells: readonly string[];
}

function Cell({ text }: { readonly text: string }) {
  const m = /^(Yes|No)\b(.*)$/s.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <Text xstyle={styles.yes}>{m[1]}</Text>
      {m[2]}
    </>
  );
}

export function CompareTable({
  rowHeading,
  columns,
  rows,
  label,
}: {
  /** What the first column is, for a screen reader (the cell itself is empty). */
  readonly rowHeading: string;
  readonly columns: readonly string[];
  readonly rows: readonly CompareRow[];
  readonly label: string;
}) {
  return (
    <>
      <VStack xstyle={styles.wide}>
        <Table density="spacious" verticalAlign="top" aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <VisuallyHidden>{rowHeading}</VisuallyHidden>
              </TableHeaderCell>
              {columns.map((c) => (
                <TableHeaderCell key={c}>{c}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>
                  <Text weight="semibold">{row.label}</Text>
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={columns[i]}>
                    <Cell text={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </VStack>

      <VStack gap={3} xstyle={styles.narrow}>
        {rows.map((row) => (
          <Card key={row.label} padding={4}>
            <VStack gap={2}>
              <Heading level={3}>{row.label}</Heading>
              {row.cells.map((cell, i) => (
                <Text as="p" key={columns[i]}>
                  <Text weight="semibold">{columns[i]}: </Text>
                  <Cell text={cell} />
                </Text>
              ))}
            </VStack>
          </Card>
        ))}
      </VStack>
    </>
  );
}
