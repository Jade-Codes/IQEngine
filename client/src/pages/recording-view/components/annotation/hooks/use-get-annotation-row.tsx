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
import Actions from '../actions';

export const useGetAnnotationRow = (index, setCurrentFFT, meta, fftSize, setMeta, setSelectedAnnotation) => {
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    if (!meta) return;
    calculateCurrentAnnotation(meta.captures[0], null);
  }, [meta]);

  const updateAnnotation = useCallback(
    (value, parent) => {
      if (!meta?.annotations) return;

      let newAnnotationValue = value;

      // Get the min and max frequencies
      const minFreq = meta.getCenterFrequency() - meta.getSampleRate() / 2;
      const maxFreq = meta.getCenterFrequency() + meta.getSampleRate() / 2;

      // Get sample rate and sample start
      const sampleRate = Number(meta.getSampleRate());
      const sampleStart = Number(parent.annotation['core:sample_start']);

      // Get the start and end dates
      if (meta.captures[0] && meta.captures[0]['core:datetime']) {
        const startDate = meta.captures[0]['core:datetime'];
        const endDate = calculateDate(meta.captures[0]['core:datetime'], meta.getTotalSamples(), sampleRate);

        if (parent.name == 'core:sample_start') {
          newAnnotationValue = calculateSampleCount(startDate, value, sampleRate);
          parent.error = validateDate(value, startDate, endDate);
        } else if (parent.name == 'core:sample_count') {
          newAnnotationValue = calculateSampleCount(startDate, value, sampleRate) - sampleStart;
          parent.error = validateDate(value, startDate, endDate);
        }
      }

      if (parent.name == 'core:freq_lower_edge') {
        newAnnotationValue = unitPrefixHzInverse(Number(value), parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      } else if (parent.name == 'core:freq_upper_edge') {
        newAnnotationValue = unitPrefixHzInverse(Number(value), parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      }
      let updatedAnnotation = { ...parent.annotation };
      updatedAnnotation[parent.name] = newAnnotationValue ? newAnnotationValue : updatedAnnotation[parent.name];
      meta.annotations[parent.index] = Object.assign(new Annotation(), updatedAnnotation);

      calculateCurrentAnnotation(meta.captures[0], parent);
      let new_meta = Object.assign(new SigMFMetadata(), meta);
      setMeta(new_meta);
    },
    [meta]
  );

  const calculateCurrentAnnotation = useCallback(
    (startCapture, parent) => {
      const annotation = Object.assign(new Annotation(), meta.annotations[index]);
      const sampleRate = Number(meta.global['core:sample_rate']);
      const startSampleCount = Number(annotation['core:sample_start']);
      const sampleCount = Number(annotation['core:sample_count']);
      const centerFrequency = meta.getCenterFrequency();
      const lowerEdge = annotation['core:freq_lower_edge']
        ? annotation['core:freq_lower_edge']
        : centerFrequency - sampleRate / 2;
      const upperEdge = annotation['core:freq_upper_edge']
        ? annotation['core:freq_upper_edge']
        : centerFrequency + sampleRate / 2;
      let currentParent = parent;

      // Get label
      const label = annotation.getLabel();

      // Get start frequency range
      const startFrequency = unitPrefixHz(lowerEdge);

      // Get end frequency range
      const endFrequency = unitPrefixHz(upperEdge);

      // Get bandwidth
      const bandwidthHz = unitPrefixHz(upperEdge - lowerEdge);

      // Get duration
      const duration = unitPrefixSeconds(sampleCount / sampleRate);

      currentParent = {
        label: {
          index: index,
          annotation: annotation,
          object: label,
          name: 'core:label',
          error: currentParent?.label?.error,
        },
        startFrequency: {
          index: index,
          annotation: annotation,
          object: startFrequency,
          name: 'core:freq_lower_edge',
          error: currentParent?.startFrequency?.error,
        },
        endFrequency: {
          index: index,
          annotation: annotation,
          object: endFrequency,
          name: 'core:freq_upper_edge',
          error: currentParent?.endFrequency?.error,
        },
        startTime: {
          index: index,
          annotation: annotation,
          object: null,
          name: 'core:sample_start',
          error: currentParent?.startTime?.error,
        },
        endTime: {
          index: index,
          annotation: annotation,
          object: null,
          name: 'core:sample_count',
          error: currentParent?.endTime?.error,
        },
        comment: {
          index: index,
          annotation: annotation,
          name: 'core:comment',
          error: currentParent?.comment?.error,
        },
      };

      let currentData = {
        annotation: index,
        frequencyRange: (
          <div className="flex flex-row">
            <div>
              <AutoSizeInput
                label={`Annotation ${index} - Frequency Start`}
                type="number"
                className={'input-number'}
                parent={currentParent.startFrequency}
                value={startFrequency.freq}
                onBlur={updateAnnotation}
              />
            </div>
            <div className="flex items-center">{startFrequency.unit} - </div>
            <div>
              <AutoSizeInput
                label={`Annotation ${index} - Frequency End`}
                type="number"
                className={'input-number'}
                parent={currentParent.endFrequency}
                value={endFrequency.freq}
                onBlur={updateAnnotation}
              />
            </div>
            <div className="flex items-center">{endFrequency.unit}</div>
          </div>
        ),
        bandwidthHz: bandwidthHz?.freq + bandwidthHz.unit,
        label: (
          <AutoSizeInput
            label={`Annotation ${index} - Label`}
            parent={currentParent.label}
            value={label}
            onBlur={updateAnnotation}
          />
        ),
        duration: duration.time + duration.unit,
        comment: (
          <AutoSizeInput
            label={`Annotation ${index} - Comment`}
            parent={currentParent.comment}
            value={annotation['core:comment']}
            onBlur={updateAnnotation}
            minWidth={200}
          />
        ),
        actions: (
          <Actions
            startSampleCount={startSampleCount}
            fftSize={fftSize}
            index={index}
            meta={meta}
            setMeta={setMeta}
            setCurrentFFT={setCurrentFFT}
            setSelectedAnnotation={setSelectedAnnotation}
          />
        ),
      };

      if (startCapture && startCapture['core:datetime']) {
        const startDate = startCapture['core:datetime'];
        // Get start time range
        const startTime = calculateDate(startDate, startSampleCount, sampleRate);
        // Get start time range
        const endTime = calculateDate(startDate, startSampleCount + sampleCount, sampleRate);

        currentParent.startTime = {
          index: index,
          annotation: annotation,
          object: startTime,
          name: 'core:sample_start',
          error: parent?.startTime?.error,
        };
        currentParent.endTime = {
          index: index,
          annotation: annotation,
          object: endTime,
          name: 'core:sample_count',
          error: parent?.endTime?.error,
        };

        if (startTime && endTime) {
          currentData['timeRange'] = (
            <div className="flex flex-row">
              <div>
                <AutoSizeInput
                  label={`Annotation ${index} - Start Time`}
                  parent={currentParent.startTime}
                  value={startTime}
                  onBlur={updateAnnotation}
                />
              </div>
              <div className="flex items-center"> - </div>
              <div>
                <AutoSizeInput
                  label={`Annotation ${index} - End Time`}
                  parent={currentParent.endTime}
                  value={endTime}
                  onBlur={updateAnnotation}
                />
              </div>
            </div>
          );
        }
      }

      setCurrentData(currentData);
    },
    [meta, parent, updateAnnotation]
  );

  return currentData;
};
