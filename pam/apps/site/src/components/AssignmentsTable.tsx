import * as stylex from '@stylexjs/stylex';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { ASSIGNMENT_ROWS, type Cell } from '@/content/assignments';

/*
 * Three columns of sentences do not fit a phone, and a table that scrolls
 * sideways is the hardest thing to read on one. So the table is for screens
 * wide enough to hold it, and below that the same rows stack: one card per
 * action, a line for each role. Both are in the page; CSS shows one. The one
 * that is hidden is `display: none`, so a screen reader reads it once.
 */
const styles = stylex.create({
  wide: { display: { default: 'block', '@media (max-width: 719px)': 'none' } },
  narrow: { display: { default: 'none', '@media (max-width: 719px)': 'flex' } },
  answer: { fontWeight: 700 },
});

function CellText({ cell }: { readonly cell: Cell }) {
  return (
    <>
      {cell.answer ? <Text xstyle={styles.answer}>{cell.answer}</Text> : null}
      {cell.answer && cell.note ? ' — ' : null}
      {cell.note ?? null}
    </>
  );
}

export function AssignmentsTable() {
  return (
    <>
      <VStack xstyle={styles.wide}>
        <Table density="spacious" verticalAlign="top" aria-label="Who can do what: case manager and super admin">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <VisuallyHidden>Action</VisuallyHidden>
              </TableHeaderCell>
              <TableHeaderCell>Case manager</TableHeaderCell>
              <TableHeaderCell>Super admin</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ASSIGNMENT_ROWS.map((row) => (
              <TableRow key={row.action}>
                <TableCell>
                  <Text weight="semibold">{row.action}</Text>
                </TableCell>
                <TableCell>
                  <CellText cell={row.caseManager} />
                </TableCell>
                <TableCell>
                  <CellText cell={row.superAdmin} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </VStack>

      <VStack gap={3} xstyle={styles.narrow}>
        {ASSIGNMENT_ROWS.map((row) => (
          <Card key={row.action} padding={4}>
            <VStack gap={2}>
              <Heading level={3}>{row.action}</Heading>
              <Text as="p">
                <Text weight="semibold">Case manager: </Text>
                <CellText cell={row.caseManager} />
              </Text>
              <Text as="p">
                <Text weight="semibold">Super admin: </Text>
                <CellText cell={row.superAdmin} />
              </Text>
            </VStack>
          </Card>
        ))}
      </VStack>
    </>
  );
}
