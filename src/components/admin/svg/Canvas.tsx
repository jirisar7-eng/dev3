import React, { useRef, useEffect, useState } from 'react';
import { SvgDocument, SvgNode, ToolType } from './types';

interface CanvasProps {
  doc: SvgDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateNode: (id: string, attrs: Record<string, string>, textContext?: string) => void;
  tool: ToolType;
  onDrawEnd: (newNode: SvgNode) => void;
  zoom: number;
}

export function Canvas({ doc, selectedId, onSelect, onUpdateNode, tool, onDrawEnd, zoom }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);
  const [initialTransform, setInitialTransform] = useState<string>('');

  const getSvgCoordinates = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const findNode = (nodes: SvgNode[], id: string): SvgNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getSvgCoordinates(e);
    setDragStart(coords);
    setDragCurrent(coords);
    setIsDragging(true);

    if (tool === 'select') {
      const target = e.target as SVGElement;
      const id = target.getAttribute('data-node-id');
      if (id) {
        onSelect(id);
        const node = findNode(doc.nodes, id);
        if (node) {
          setInitialTransform(node.attrs.transform || '');
        }
      } else {
        onSelect(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const coords = getSvgCoordinates(e);
    setDragCurrent(coords);

    if (tool === 'select' && selectedId) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      const node = findNode(doc.nodes, selectedId);
      if (node) {
        // basic drag implementation: append translation to transform
        // A robust implementation would parse the transform or update x/y directly based on shape type
        if (node.type === 'circle' || node.type === 'ellipse') {
            const newCx = parseFloat(node.attrs.cx || '0') + dx;
            const newCy = parseFloat(node.attrs.cy || '0') + dy;
            // update node in real time is tricky without state ping-pong, 
            // maybe we just update it on mouse up. For visual feedback during drag:
            const el = svgRef.current?.querySelector(`[data-node-id="${selectedId}"]`);
            if (el) {
                el.setAttribute('transform', `${initialTransform} translate(${dx}, ${dy})`);
            }
        } else {
            const el = svgRef.current?.querySelector(`[data-node-id="${selectedId}"]`);
            if (el) {
                el.setAttribute('transform', `${initialTransform} translate(${dx}, ${dy})`);
            }
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !dragCurrent) {
        setIsDragging(false);
        return;
    }
    
    if (tool === 'select' && selectedId) {
        const dx = dragCurrent.x - dragStart.x;
        const dy = dragCurrent.y - dragStart.y;
        
        // We actually want to bake the translation into the node's attributes if possible, or just update the transform.
        const node = findNode(doc.nodes, selectedId);
        if (node && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
            // append translation
            const newTransform = `${initialTransform} translate(${dx}, ${dy})`.trim();
            onUpdateNode(selectedId, { ...node.attrs, transform: newTransform });
        }
    } else if (tool !== 'select') {
       // Draw new shape
       const x = Math.min(dragStart.x, dragCurrent.x);
       const y = Math.min(dragStart.y, dragCurrent.y);
       const w = Math.abs(dragCurrent.x - dragStart.x);
       const h = Math.abs(dragCurrent.y - dragStart.y);

       if (w > 5 || h > 5 || tool === 'text') {
           const id = crypto.randomUUID();
           const fill = '#60a5fa';
           let newNode: SvgNode | null = null;

           if (tool === 'rect') {
               newNode = { id, type: 'rect', attrs: { x: String(x), y: String(y), width: String(w), height: String(h), fill }, children: [] };
           } else if (tool === 'circle') {
               const r = Math.max(w, h) / 2;
               newNode = { id, type: 'circle', attrs: { cx: String(dragStart.x), cy: String(dragStart.y), r: String(r), fill }, children: [] };
           } else if (tool === 'ellipse') {
               newNode = { id, type: 'ellipse', attrs: { cx: String(dragStart.x), cy: String(dragStart.y), rx: String(w/2), ry: String(h/2), fill }, children: [] };
           } else if (tool === 'line') {
               newNode = { id, type: 'line', attrs: { x1: String(dragStart.x), y1: String(dragStart.y), x2: String(dragCurrent.x), y2: String(dragCurrent.y), stroke: fill, 'stroke-width': '2' }, children: [] };
           } else if (tool === 'text') {
               newNode = { id, type: 'text', attrs: { x: String(dragStart.x), y: String(dragStart.y), fill, 'font-family': 'system-ui', 'font-size': '24' }, textContext: 'Nový text', children: [] };
           }

           if (newNode) {
               onDrawEnd(newNode);
           }
       }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const renderNode = (node: SvgNode) => {
    if (node.hidden) return null;
    
    const attrs = { ...node.attrs, 'data-node-id': node.id };
    
    // Add selection styling
    if (node.id === selectedId) {
        if (!attrs['stroke']) attrs['stroke'] = '#3b82f6';
        if (!attrs['stroke-width']) attrs['stroke-width'] = '2';
        attrs['stroke-dasharray'] = '4';
    }

    if (node.type === 'text') {
        return React.createElement('text', { key: node.id, ...attrs }, node.textContext);
    }

    if (node.children && node.children.length > 0) {
        return React.createElement(node.type, { key: node.id, ...attrs }, node.children.map(renderNode));
    }

    return React.createElement(node.type, { key: node.id, ...attrs });
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-100 flex items-center justify-center p-4">
        <svg 
            ref={svgRef}
            viewBox={doc.viewBox} 
            width={doc.width} 
            height={doc.height}
            className="bg-white shadow-sm border border-slate-200 cursor-crosshair"
            style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '100%'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Draw checkerboard for transparent bg */}
            <defs>
              <pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#f1f5f9" />
                <rect x="10" width="10" height="10" fill="#e2e8f0" />
                <rect y="10" width="10" height="10" fill="#e2e8f0" />
                <rect x="10" y="10" width="10" height="10" fill="#f1f5f9" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#checker)" style={{ pointerEvents: 'none' }} />
            
            {doc.nodes.map(renderNode)}

            {/* Render temporary drawing shape */}
            {isDragging && tool !== 'select' && dragStart && dragCurrent && (
                <rect 
                    x={Math.min(dragStart.x, dragCurrent.x)}
                    y={Math.min(dragStart.y, dragCurrent.y)}
                    width={Math.abs(dragCurrent.x - dragStart.x)}
                    height={Math.abs(dragCurrent.y - dragStart.y)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4"
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </svg>
    </div>
  );
}
