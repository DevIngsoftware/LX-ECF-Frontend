import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import type { PageQuery } from '@/types/common';
import { useDebounce } from './use-debounce';

/** Estado estándar de búsqueda, paginación y orden para tablas paginadas en servidor. */
export function useTableQuery(initial: { size?: number; sort?: SortingState } = {}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearchState] = useState('');
  const [sorting, setSorting] = useState<SortingState>(initial.sort ?? []);
  const debouncedSearch = useDebounce(search);

  const setSearch = (v: string) => {
    setSearchState(v);
    setPageIndex(0);
  };

  const query: PageQuery = {
    page: pageIndex,
    size: initial.size ?? 10,
    search: debouncedSearch || undefined,
    sort: sorting[0]?.id,
    direction: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  };

  return { query, pageIndex, setPageIndex, search, setSearch, sorting, setSorting, resetPage: () => setPageIndex(0) };
}
