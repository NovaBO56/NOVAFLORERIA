type Page<T> = { data: T[] | null; error: { message?: string } | null; count: number | null };

/** Every query must have exact count and a unique, stable order. Fail rather than
 * returning an apparently successful partial report. Pages stay below max_rows. */
export async function readAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<Page<T>>) {
  const rows: T[] = [];
  const pageSize = 500;
  for (;;) {
    const { data, error, count } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw new Error(error.message ?? "No se pudieron obtener los datos.");
    if (count === null || !data) throw new Error("No se pudo verificar el total de resultados.");
    rows.push(...data);
    if (rows.length >= count) return rows;
    if (!data.length) throw new Error("El conjunto de resultados cambió durante la consulta. Reintenta.");
  }
}
