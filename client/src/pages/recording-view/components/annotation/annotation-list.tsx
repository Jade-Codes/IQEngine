import DataTable from '@/features/ui/data-table/DataTable';
import React, { useCallback, useEffect, useState } from 'react';
import {
  calculateDate,
  calculateSampleCount,
  unitPrefixHzInverse,
  unitPrefixHz,
  unitPrefixSeconds,
  validateFrequency,
  validateDate,
} from '@/utils/rf-functions';
import AutoSizeInput from '@/features/ui/auto-size-input/AutoSizeInput';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import Actions from './actions';
import { useSpectrogramContext } from '../../hooks/use-spectrogram-context';
import AnnotationRow from './annotation-row';
import { useGetAnnotationRow } from './hooks/use-get-annotation-row';

interface AnnotationListProps {
  setCurrentFFT: (current: number) => void;
}

export const AnnotationList = ({ setCurrentFFT }: AnnotationListProps) => {
  const { meta, fftSize, setMeta, setSelectedAnnotation } = useSpectrogramContext();
  const [data, setData] = useState([]);

  const originalColumns = [
    { title: 'Annotation', dataIndex: 'annotation' },
    { title: 'Frequency Range', dataIndex: 'frequencyRange' },
    { title: 'BW', dataIndex: 'bandwidthHz' },
    { title: 'Label', dataIndex: 'label' },
    { title: 'Time Range', dataIndex: 'timeRange' },
    { title: 'Comment', dataIndex: 'comment' },
    { title: 'Duration', dataIndex: 'duration' },
    { title: 'Actions', dataIndex: 'actions' },
  ];
  const [columns, setColumns] = useState(originalColumns);

  const calculateColumns = useCallback(() => {
    if (data?.length > 0) {
      const newColumns = originalColumns.filter((column) => {
        console.log(column.dataIndex);
        console.log(data);
        if (column.dataIndex !== undefined && data.find((row) => row[column.dataIndex] !== undefined)) {
          return column;
        }
      });
      setColumns(newColumns);
    }
  }, [columns, data]);

  const calculateAnnotationsData = useCallback(() => {
    const data = [];
    if (!meta?.annotations) return;

    for (let i = 0; i < meta.annotations?.length; i++) {
      data.push(i);
    }

    return data;
  }, [meta]);

  useEffect(() => {
    const indexes = calculateAnnotationsData();
    if (!indexes) return;
    for (const index of indexes) {
      const currentData = useGetAnnotationRow(index, setCurrentFFT, meta, fftSize, setMeta, setSelectedAnnotation);
      if (currentData) {
        setData({ ...data });
      }
    }
  }, [meta]);

  useEffect(() => {
    calculateColumns();
  }, [data]);

  return <DataTable dataColumns={columns} dataRows={data} />;
};

export default AnnotationList;
