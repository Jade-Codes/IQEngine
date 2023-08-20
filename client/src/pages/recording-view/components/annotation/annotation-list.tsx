import { DataTable } from '@/features/ui/react-table/react-table';
import React, { useCallback, useEffect, useState } from 'react';
import { useSpectrogramContext } from '../../hooks/use-spectrogram-context';
import { useGetAnnotationRow } from './hooks/use-get-annotation-row';

interface AnnotationListProps {
  setCurrentFFT: (current: number) => void;
}

export const AnnotationList = ({ setCurrentFFT }: AnnotationListProps) => {
  const { meta, fftSize, setMeta, setSelectedAnnotation } = useSpectrogramContext();
  const [data, setData] = useState([]);

  const originalColumns = [
    { header: 'Annotation', accessorKey: 'annotation' },
    { header: 'Frequency Range', accessorKey: 'frequencyRange' },
    { header: 'BW', accessorKey: 'bandwidthHz' },
    { header: 'Label', accessorKey: 'label' },
    { header: 'Time Range', accessorKey: 'timeRange' },
    { header: 'Comment', accessorKey: 'comment' },
    { header: 'Duration', accessorKey: 'duration' },
    { header: 'Actions', accessorKey: 'actions' },
  ];
  const [columns, setColumns] = useState(originalColumns);

  useEffect(() => {
    if (data?.length > 0) {
      const newColumns = originalColumns.filter((column) => {
        if (data.find((row) => row[column.accessorKey] !== undefined)) {
          return column;
        }
      });
      setColumns(newColumns);
    }
  }, [data]);

  useEffect(() => {
    if (!meta?.annotations) return;
    const newData = meta.annotations.map((annotation, index) => {
      return useGetAnnotationRow(annotation, index, setCurrentFFT, meta, fftSize, setMeta, setSelectedAnnotation);
    });
    setData(newData);
  }, [meta]);

  return <DataTable dataColumns={columns} dataRows={data} />;
};

export default AnnotationList;
