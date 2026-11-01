/** One page of a paginated list, in the app's terms. */
export interface Page<T> {
  items: T[];
  /** 1-based number of this page. */
  page: number;
  lastPage: number;
  total: number;
}

/** The fields of the API's `pagination` block that a page needs. */
interface PaginationDto {
  current_page: number;
  last_page: number;
  total: number;
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Guards the API's `pagination` block before it is trusted. */
export function isPaginationDto(value: unknown): value is PaginationDto {
  if (typeof value !== "object" || value === null) return false;
  const { current_page, last_page, total } = value as Record<string, unknown>;
  return isCount(current_page) && isCount(last_page) && isCount(total);
}

export const toPage = <T>(items: T[], pagination: PaginationDto): Page<T> => ({
  items,
  page: pagination.current_page,
  lastPage: pagination.last_page,
  total: pagination.total,
});

export const hasNextPage = (page: Pick<Page<unknown>, "page" | "lastPage">) =>
  page.page < page.lastPage;
