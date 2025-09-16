/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';

export interface ActiveText {
  text: string;
  fontFamily: string;
  fontSize: number; // in display pixels
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  x: number; // in natural image coordinates
  y: number; // in natural image coordinates
  displayX: number; // in display coordinates (relative to image container element)
  displayY: number; // in display coordinates (relative to image container element)
}

// Exporting this to be used in App.tsx
export interface ComponentLayer {
  id: string;
  src: string;
  originalFile: File;
  x: number; // Center X as a percentage of the container (0-1)
  y: number; // Center Y as a percentage of the container (0-1)
  scale: number;
  rotation: number; // degrees
  flipH: boolean;
  flipV: boolean;
}

interface InteractiveTextProps {
  textData: ActiveText;
  onUpdate: (newData: ActiveText) => void;
  imageRef: HTMLImageElement;
}

const getRenderedImageGeometry = (imageElement: HTMLImageElement) => {
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imageElement;
    const naturalAspectRatio = naturalWidth / naturalHeight;
    const clientAspectRatio = clientWidth / clientHeight;
    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (naturalAspectRatio > clientAspectRatio) {
        renderedWidth = clientWidth;
        renderedHeight = clientWidth / naturalAspectRatio;
        offsetX = 0;
        offsetY = (clientHeight - renderedHeight) / 2;
    } else {
        renderedHeight = clientHeight;
        renderedWidth = clientHeight * naturalAspectRatio;
        offsetY = 0;
        offsetX = (clientWidth - renderedWidth) / 2;
    }
    const scale = naturalWidth / renderedWidth;
    return { renderedWidth, renderedHeight, offsetX, offsetY, scale };
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ textData, onUpdate, imageRef }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, textX: 0, textY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, fontSize: 0 });

  const { text, fontFamily, fontSize, fontWeight, fontStyle, color, displayX, displayY } = textData;

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      textX: textData.displayX,
      textY: textData.displayY,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      fontSize: textData.fontSize,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const geometry = getRenderedImageGeometry(imageRef);

      if (isDragging) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        let newDisplayX = dragStart.current.textX + dx;
        let newDisplayY = dragStart.current.textY + dy;
        
        // Constrain dragging to within the rendered image bounds
        newDisplayX = Math.max(geometry.offsetX, Math.min(newDisplayX, geometry.renderedWidth + geometry.offsetX));
        newDisplayY = Math.max(geometry.offsetY, Math.min(newDisplayY, geometry.renderedHeight + geometry.offsetY));

        const imageRelativeX = newDisplayX - geometry.offsetX;
        const imageRelativeY = newDisplayY - geometry.offsetY;

        onUpdate({
          ...textData,
          displayX: newDisplayX,
          displayY: newDisplayY,
          x: imageRelativeX * geometry.scale,
          y: imageRelativeY * geometry.scale,
        });
      }

      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        const newFontSize = Math.max(8, resizeStart.current.fontSize + delta * 0.5);
        
        onUpdate({
          ...textData,
          fontSize: newFontSize,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, textData, onUpdate, imageRef]);

  return (
    <div
      ref={textRef}
      onMouseDown={handleDragStart}
      className="absolute group border-2 border-dashed border-transparent hover:border-blue-500 p-2 cursor-move select-none"
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        transform: 'translate(-50%, -50%)',
        color,
        fontFamily: `"${fontFamily}", sans-serif`,
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
      aria-label={`Editable text: ${text}. Drag to move, use handle to resize.`}
      role="button"
      tabIndex={0}
    >
      {text}
      <div
        onMouseDown={handleResizeStart}
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Resize text"
      ></div>
    </div>
  );
};

export default InteractiveText;
