import '@tanstack/react-query';
import { useParams as useParamsOriginal } from 'react-router-dom';

declare module '@tanstack/react-query' {
  interface UseQueryOptions<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> {
    queryKey: TQueryKey;
    queryFn?: QueryFunction<TQueryFnData, TQueryKey>;
    enabled?: boolean;
  }
}

declare module 'react-router-dom' {
  export function useParams<T extends Record<string, string | undefined> = {}>(): T;
} 