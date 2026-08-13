import React from 'react';
import { Render, type Data } from '@measured/puck';
import { puckConfig, normalizePuckData } from './puck.config';

export interface PageRenderProps {
  data: Data;
  className?: string;
}

export const PageRender: React.FC<PageRenderProps> = ({ data, className = '' }) => {
  if (!data) {
    return null;
  }

  const normalizedData = React.useMemo(() => normalizePuckData(data), [data]);

  return (
    <div className={`puck-render-wrapper ${className}`.trim()}>
      <Render config={puckConfig} data={normalizedData} />
    </div>
  );
};

export default PageRender;
