import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Button from './Button';

export interface PaginationProps<T> {
  collectionPath: string;
  pageSize: number;
  orderByField?: string;
  sortOrder?: 'asc' | 'desc';
  additionalConstraints?: QueryConstraint[];
  onDataChange?: (data: (T & { id: string })[]) => Promise<(T & { id: string })[]>;
  renderData: (
    data: (T & { id: string })[],
    isLoading: boolean,
    error: string | null,
    currentPage: number,
    hasNextPage: boolean,
    setCurrentPage: (page: number) => void
  ) => React.ReactNode;
}

function Pagination<T>({
  collectionPath,
  pageSize,
  orderByField = 'createdAt',
  sortOrder = 'desc',
  additionalConstraints = [],
  onDataChange,
  renderData,
}: PaginationProps<T>) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const pageCursors = useRef<Record<number, QueryDocumentSnapshot<DocumentData> | null>>({ 1: null });

  const fetchPage = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const constraints: QueryConstraint[] = [
        ...additionalConstraints,
        orderBy(orderByField, sortOrder),
        limit(pageSize),
      ];

      const cursor = pageCursors.current[page];
      if (cursor) {
        constraints.push(startAfter(cursor));
      }

      const q = query(collection(db, collectionPath), ...constraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs;
      let items = docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      }));

      if (onDataChange) {
        items = await onDataChange(items);
      }

      setData(items);
      setHasNextPage(docs.length === pageSize);

      if (docs.length > 0) {
        pageCursors.current[page + 1] = docs[docs.length - 1];
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    pageCursors.current = { 1: null };
    setCurrentPage(1);
  }, [collectionPath, JSON.stringify(additionalConstraints), orderByField, sortOrder]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage]);

  const handleNext = () => {
    if (hasNextPage) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="space-y-6">
      {renderData(data, isLoading, error, currentPage, hasNextPage, setCurrentPage)}
      <div className="flex justify-end items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentPage === 1 || isLoading}>
          Prev
        </Button>
        <span className="text-sm px-2">Page {currentPage}</span>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNextPage || isLoading}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
