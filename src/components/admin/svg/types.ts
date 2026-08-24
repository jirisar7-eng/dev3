export type SvgNodeType = 'svg' | 'g' | 'path' | 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon' | 'text';

export interface SvgNode {
  id: string;
  type: SvgNodeType;
  attrs: Record<string, string>;
  children: SvgNode[];
  textContext?: string;
  hidden?: boolean;
}

export interface SvgDocument {
  viewBox: string;
  width: string;
  height: string;
  nodes: SvgNode[];
}

export type ToolType = 'select' | 'rect' | 'circle' | 'ellipse' | 'line' | 'text' | 'path';
