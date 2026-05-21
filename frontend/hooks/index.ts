/**
 * Custom React Hooks for Claims Management UI
 * 
 * This module provides reusable hooks for common functionality:
 * - useDebounce: Debounce rapidly changing values (e.g., search input)
 * - useLocalStorage: Persist and sync state with localStorage
 * - useMediaQuery: Respond to CSS media query changes
 * - TanStack Query hooks: useClaims, useDataSources, useUploadFile, useDataSourceMutations
 */

export { useDebounce } from './use-debounce'
export { useLocalStorage } from './use-local-storage'
export { useMediaQuery } from './use-media-query'
export {
  useClaims,
  useDataSources,
  useUploadFile,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
  useDataSourceMutations,
  queryKeys,
} from './queries'
