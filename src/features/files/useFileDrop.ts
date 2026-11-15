import { useEffect, useRef, useState } from 'react';

function hasFiles(event: DragEvent) {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

/**
 * Window-wide file drop. Shows `dragging` while files are over the page;
 * text or links dragged into the editor are left alone.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  });

  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      // CodeMirror would otherwise insert the file's text at the drop point.
      event.stopPropagation();
      depth.current = 0;
      setDragging(false);
      const files = [...(event.dataTransfer?.files ?? [])];
      if (files.length) onFilesRef.current(files);
    };
    // Capture phase so the editor doesn't insert the file name as text.
    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('dragleave', onDragLeave, true);
    window.addEventListener('drop', onDrop, true);
    return () => {
      window.removeEventListener('dragenter', onDragEnter, true);
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('dragleave', onDragLeave, true);
      window.removeEventListener('drop', onDrop, true);
    };
  }, []);

  return dragging;
}
