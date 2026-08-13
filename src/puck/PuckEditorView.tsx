import React from 'react';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { puckConfig, normalizePuckData } from './config';

export interface PuckEditorViewProps {
  initialData?: Data;
  onSave: (data: Data) => void | Promise<void>;
  onChange?: (data: Data) => void;
  title?: string;
  className?: string;
}

export const PuckEditorView: React.FC<PuckEditorViewProps> = ({
  initialData = { content: [], root: {} },
  onSave,
  onChange,
  title,
  className = '',
}) => {
  const normalizedData = React.useMemo(() => normalizePuckData(initialData), [initialData]);

  return (
    <div className={`puck-editor-view w-full min-h-[calc(100vh-4rem)] ${className}`.trim()}>
      {title && (
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <span className="text-xs text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
            Puck Editor v0.5.1
          </span>
        </div>
      )}
      <Puck
        config={puckConfig}
        data={normalizedData}
        onPublish={onSave}
        onChange={onChange}
      />
    </div>
  );
};

export default PuckEditorView;
