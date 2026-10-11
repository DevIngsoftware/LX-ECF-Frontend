export type Id = string;
export type ISODate = string;

/** Forma compatible con org.springframework.data.domain.Page */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export type DatePreset = 'today' | '7d' | 'month' | 'year' | 'custom';

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

export type Severity = 'info' | 'success' | 'warning' | 'error';

/** Estado abierto: admite valores conocidos y cualquier otro que devuelva el backend. */
export type OpenString<T extends string> = T | (string & {});
