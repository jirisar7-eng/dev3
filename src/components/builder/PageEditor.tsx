import React from 'react';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { puckConfig, normalizePuckData } from './puck.config';

export interface PageEditorProps {
  initialData?: Data;
  onSave: (data: Data) => void | Promise<void>;
  onChange?: (data: Data) => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  initialData = { content: [], root: {} },
  onSave,
  onChange,
}) => {
  const normalizedData = React.useMemo(() => normalizePuckData(initialData), [initialData]);

  return (
    <div className="puck-editor-wrapper w-full min-h-[calc(100vh-4rem)]">
      <Puck
        config={puckConfig}
        data={normalizedData}
        onPublish={onSave}
        onChange={onChange}
      />
    </div>
  );
};

export default PageEditor;
