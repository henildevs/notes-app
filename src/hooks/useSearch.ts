import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note } from '../types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface SearchResult {
  notes: Note[];
  query: string;
  isLoading: boolean;
  updateQuery: (newQuery: string) => void;
  clearQuery: () => void;
}

export const useSearch = (
  notes: Note[],
  options: UseSearchOptions = {}
): SearchResult => {
  const { debounceMs = 300, minQueryLength = 1 } = options;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the search query
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsLoading(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [query, debounceMs]);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      return notes;
    }

    const searchTerm = debouncedQuery.toLowerCase();
    
    return notes.filter(note => {
      // Search in title
      if (note.title.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in content (plain text)
      if (note.plainTextContent?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in tags
      if (note.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        return true;
      }

      return false;
    });
  }, [notes, debouncedQuery, minQueryLength]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    notes: searchResults,
    query: debouncedQuery,
    isLoading,
    updateQuery,
    clearQuery,
  };
};

export default useSearch;
