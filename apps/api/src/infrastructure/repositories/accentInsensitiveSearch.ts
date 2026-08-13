import { Prisma, PrismaClient } from "@prisma/client";

// Prisma's fluent `contains`/`mode: "insensitive"` only ignores case, not accents — searching
// "gomez" won't find "Gómez". Postgres' unaccent() extension (see the
// enable_unaccent_extension migration) handles that, but Prisma's query builder can't wrap a
// column in an arbitrary SQL function, so this resolves the matching row ids via one small raw
// query and hands them back as a plain `id IN (...)` filter — every other Prisma feature
// (include, orderBy, pagination, count) keeps working exactly as before.
//
// `table` and `columns` are always literals from our own call sites, never user input, so
// building identifiers with Prisma.raw is safe; only `term` (the actual search string) goes
// through Prisma.sql's parameterized interpolation.
export async function findIdsByUnaccentedSearch(
  prisma: PrismaClient,
  table: string,
  columns: string[],
  term: string
): Promise<string[]> {
  const pattern = `%${term}%`;
  const conditions = Prisma.join(
    columns.map((column) => Prisma.sql`unaccent(${Prisma.raw(`"${column}"`)}) ILIKE unaccent(${pattern})`),
    " OR "
  );

  const rows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT id FROM ${Prisma.raw(table)} WHERE ${conditions}`
  );
  return rows.map((row) => row.id);
}
