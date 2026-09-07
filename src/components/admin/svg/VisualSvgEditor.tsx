import React, { useState, useEffect, useCallback } from 'react';
import { parseSvgString } from './parser';
import { serializeSvgDocument } from './serializer';
import { SvgDocument, SvgNode, ToolType } from './types';
import { useHistory } from './useHistory';
import { Canvas } from './Canvas';
import { 
  MousePointer2, Square, Circle, Type, Save, Undo, Redo, 
  Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown, Code, CheckCircle
} from 'lucide-react';

interface VisualSvgEditorProps {
  initialSvg: string;
  onSave: (svg: string) => Promise<void>;
  onCancel: () => void;
}

export function VisualSvgEditor({ initialSvg, onSave, onCancel }: VisualSvgEditorProps) {
  const defaultDoc: SvgDocument = { viewBox: '0 0 400 120', width: '100%', height: '100%', nodes: [] };
  const parsed = parseSvgString(initialSvg) || defaultDoc;
  
  const { state: doc, pushState, undo, redo, canUndo, canRedo } = useHistory<SvgDocument>(parsed, 50);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolType>('select');
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if typing in an input
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (selectedId) {
           handleDeleteNode(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        // Simple duplicate for now
        handleDuplicateNode(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, doc]);

  const handleUpdateNode = useCallback((id: string, attrs: Record<string, string>, textContext?: string) => {
    const updateRecursively = (nodes: SvgNode[]): SvgNode[] => {
      return nodes.map(n => {
        if (n.id === id) {
          return { ...n, attrs, textContext: textContext !== undefined ? textContext : n.textContext };
        }
        if (n.children) {
          return { ...n, children: updateRecursively(n.children) };
        }
        return n;
      });
    };
    pushState({ ...doc, nodes: updateRecursively(doc.nodes) });
  }, [doc, pushState]);

  const handleDrawEnd = (newNode: SvgNode) => {
    pushState({ ...doc, nodes: [...doc.nodes, newNode] });
    setSelectedId(newNode.id);
    setTool('select');
  };

  const handleDeleteNode = (id: string) => {
    const deleteRecursively = (nodes: SvgNode[]): SvgNode[] => {
      return nodes.filter(n => n.id !== id).map(n => ({
        ...n,
        children: n.children ? deleteRecursively(n.children) : []
      }));
    };
    pushState({ ...doc, nodes: deleteRecursively(doc.nodes) });
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicateNode = (id: string) => {
    let duplicated: SvgNode | null = null;
    const findAndDuplicate = (nodes: SvgNode[]): SvgNode | null => {
      for (const n of nodes) {
        if (n.id === id) return JSON.parse(JSON.stringify(n));
        if (n.children) {
           const found = findAndDuplicate(n.children);
           if (found) return found;
        }
      }
      return null;
    };
    
    const nodeToCopy = findAndDuplicate(doc.nodes);
    if (nodeToCopy) {
       nodeToCopy.id = crypto.randomUUID();
       // offset slightly
       if (nodeToCopy.attrs.x) nodeToCopy.attrs.x = String(parseFloat(nodeToCopy.attrs.x) + 10);
       if (nodeToCopy.attrs.y) nodeToCopy.attrs.y = String(parseFloat(nodeToCopy.attrs.y) + 10);
       if (nodeToCopy.attrs.cx) nodeToCopy.attrs.cx = String(parseFloat(nodeToCopy.attrs.cx) + 10);
       if (nodeToCopy.attrs.cy) nodeToCopy.attrs.cy = String(parseFloat(nodeToCopy.attrs.cy) + 10);
       
       pushState({ ...doc, nodes: [...doc.nodes, nodeToCopy] });
       setSelectedId(nodeToCopy.id);
    }
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const newNodes = [...doc.nodes];
    const index = newNodes.findIndex(n => n.id === id);
    if (index === -1) return; // For simplicity, only top level reordering implemented here
    
    if (direction === 'up' && index < newNodes.length - 1) {
      const temp = newNodes[index];
      newNodes[index] = newNodes[index + 1];
      newNodes[index + 1] = temp;
      pushState({ ...doc, nodes: newNodes });
    } else if (direction === 'down' && index > 0) {
      const temp = newNodes[index];
      newNodes[index] = newNodes[index - 1];
      newNodes[index - 1] = temp;
      pushState({ ...doc, nodes: newNodes });
    }
  };

  const handleToggleVisibility = (id: string) => {
    const toggleRecursively = (nodes: SvgNode[]): SvgNode[] => {
      return nodes.map(n => {
        if (n.id === id) return { ...n, hidden: !n.hidden };
        if (n.children) return { ...n, children: toggleRecursively(n.children) };
        return n;
      });
    };
    pushState({ ...doc, nodes: toggleRecursively(doc.nodes) });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const svgString = serializeSvgDocument(doc);
      await onSave(svgString);
    } catch (e: any) {
      setError(e.message || 'Chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  // Find selected node for properties panel
  let selectedNode: SvgNode | null = null;
  const findSelected = (nodes: SvgNode[]) => {
    for (const n of nodes) {
      if (n.id === selectedId) selectedNode = n;
      if (n.children) findSelected(n.children);
    }
  };
  if (selectedId) findSelected(doc.nodes);

  return (
    <div className="flex flex-col h-full w-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
           <button onClick={() => setTool('select')} className={`p-2 rounded ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`} title="Výběr"><MousePointer2 className="w-4 h-4" /></button>
           <button onClick={() => setTool('rect')} className={`p-2 rounded ${tool === 'rect' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`} title="Obdélník"><Square className="w-4 h-4" /></button>
           <button onClick={() => setTool('circle')} className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`} title="Kruh"><Circle className="w-4 h-4" /></button>
           <button onClick={() => setTool('text')} className={`p-2 rounded ${tool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`} title="Text"><Type className="w-4 h-4" /></button>
           <div className="w-px h-6 bg-slate-300 mx-2"></div>
           <button onClick={undo} disabled={!canUndo} className="p-2 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30" title="Zpět (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
           <button onClick={redo} disabled={!canRedo} className="p-2 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30" title="Vpřed (Ctrl+Shift+Z)"><Redo className="w-4 h-4" /></button>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2">Zoom: {Math.round(zoom * 100)}%</span>
            <input type="range" min="0.1" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-24" />
            
            <button onClick={onCancel} className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg ml-4">Zrušit</button>
            <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
               {isSaving ? 'Ukládám...' : <><Save className="w-4 h-4" /> Uložit a použít</>}
            </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 text-sm font-bold border-b border-red-200">{error}</div>}

      <div className="flex flex-1 overflow-hidden">
         {/* Canvas Area */}
         <div className="flex-1 relative overflow-hidden bg-slate-100">
             <Canvas 
                doc={doc} 
                selectedId={selectedId} 
                onSelect={setSelectedId} 
                onUpdateNode={handleUpdateNode}
                tool={tool}
                onDrawEnd={handleDrawEnd}
                zoom={zoom}
             />
         </div>

         {/* Right Sidebar: Properties & Layers */}
         <div className="w-72 border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
            {/* Properties */}
            <div className="p-4 border-b border-slate-200">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Vlastnosti</h3>
               {selectedNode ? (
                   <div className="space-y-3">
                       <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-sm font-bold text-slate-700">{selectedNode.type}</span>
                          <div className="flex gap-1">
                             <button onClick={() => handleDuplicateNode(selectedNode!.id)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Copy className="w-3.5 h-3.5" /></button>
                             <button onClick={() => handleDeleteNode(selectedNode!.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                       </div>
                       
                       {/* Common attributes editor */}
                       {['fill', 'stroke', 'stroke-width', 'opacity'].map(attr => (
                          <div key={attr} className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-600">{attr}</label>
                              <input 
                                  type="text" 
                                  value={selectedNode!.attrs[attr] || ''} 
                                  onChange={e => handleUpdateNode(selectedNode!.id, { ...selectedNode!.attrs, [attr]: e.target.value })}
                                  className="w-32 px-2 py-1 text-xs border border-slate-300 rounded"
                              />
                          </div>
                       ))}
                       
                       {/* Text attributes */}
                       {selectedNode.type === 'text' && (
                           <>
                              <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-slate-600">Text</label>
                                  <input 
                                      type="text" 
                                      value={selectedNode.textContext || ''} 
                                      onChange={e => handleUpdateNode(selectedNode!.id, selectedNode!.attrs, e.target.value)}
                                      className="w-32 px-2 py-1 text-xs border border-slate-300 rounded"
                                  />
                              </div>
                              {['font-family', 'font-size', 'font-weight', 'letter-spacing'].map(attr => (
                                <div key={attr} className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-600">{attr}</label>
                                    <input 
                                        type="text" 
                                        value={selectedNode!.attrs[attr] || ''} 
                                        onChange={e => handleUpdateNode(selectedNode!.id, { ...selectedNode!.attrs, [attr]: e.target.value })}
                                        className="w-32 px-2 py-1 text-xs border border-slate-300 rounded"
                                    />
                                </div>
                              ))}
                           </>
                       )}
                       
                       <div className="mt-4 pt-4 border-t border-slate-200">
                           <label className="text-xs font-semibold text-slate-600 block mb-1">Transform (Advanced)</label>
                           <input 
                               type="text" 
                               value={selectedNode.attrs['transform'] || ''} 
                               onChange={e => handleUpdateNode(selectedNode!.id, { ...selectedNode!.attrs, transform: e.target.value })}
                               className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                           />
                       </div>
                   </div>
               ) : (
                   <div className="text-sm text-slate-500 text-center py-4">Vyberte objekt pro úpravu vlastností.</div>
               )}
            </div>
            
            {/* Layers */}
            <div className="p-4 flex-1">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Vrstvy (Top Level)</h3>
               <div className="space-y-1">
                  {[...doc.nodes].reverse().map(node => (
                      <div 
                         key={node.id} 
                         className={`flex items-center justify-between p-2 rounded border text-sm cursor-pointer ${selectedId === node.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                         onClick={() => setSelectedId(node.id)}
                      >
                          <div className="flex items-center gap-2">
                              {node.type === 'text' ? <Type className="w-3.5 h-3.5 text-slate-400" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                              <span className="font-semibold text-slate-700 truncate w-24">
                                  {node.type} {node.type === 'text' && node.textContext ? `"${node.textContext}"` : ''}
                              </span>
                          </div>
                          <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleToggleVisibility(node.id); }} className="p-1 text-slate-400 hover:text-slate-600">
                                  {node.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(node.id, 'up'); }} className="p-1 text-slate-400 hover:text-slate-600"><ChevronUp className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(node.id, 'down'); }} className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown className="w-3 h-3" /></button>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
            
         </div>
      </div>
    </div>
  );
}
