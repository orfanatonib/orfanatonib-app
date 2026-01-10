import { useState, useCallback } from "react";

interface UseExpandedMediaTypesReturn {
  expandedMediaTypes: { [key: string]: boolean };
  toggleMediaType: (sectionId: string, mediaType: string) => void;
  isExpanded: (sectionId: string, mediaType: string) => boolean;
  expandAll: (sectionId: string) => void;
  collapseAll: (sectionId: string) => void;
}

export function useExpandedMediaTypes(): UseExpandedMediaTypesReturn {
  const [expandedMediaTypes, setExpandedMediaTypes] = useState<{ [key: string]: boolean }>({});

  const toggleMediaType = useCallback((sectionId: string, mediaType: string) => {
    const key = `${sectionId}-${mediaType}`;
    setExpandedMediaTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const isExpanded = useCallback(
    (sectionId: string, mediaType: string) => {
      const key = `${sectionId}-${mediaType}`;
      return !!expandedMediaTypes[key];
    },
    [expandedMediaTypes]
  );

  const expandAll = useCallback((sectionId: string) => {
    setExpandedMediaTypes((prev) => ({
      ...prev,
      [`${sectionId}-videos`]: true,
      [`${sectionId}-documents`]: true,
      [`${sectionId}-images`]: true,
    }));
  }, []);

  const collapseAll = useCallback((sectionId: string) => {
    setExpandedMediaTypes((prev) => ({
      ...prev,
      [`${sectionId}-videos`]: false,
      [`${sectionId}-documents`]: false,
      [`${sectionId}-images`]: false,
    }));
  }, []);

  return {
    expandedMediaTypes,
    toggleMediaType,
    isExpanded,
    expandAll,
    collapseAll,
  };
}
