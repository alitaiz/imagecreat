/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import type { ComponentLayer } from './InteractiveText';

interface InteractiveComponentProps {
  data: ComponentLayer;
  onUpdate: (newData: ComponentLayer) => void;
  imageRef: HTMLImageElement;
  isActive: boolean;
  onSelect: () => void;
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
    return { renderedWidth, renderedHeight, offsetX, offsetY };
}


const InteractiveComponent: React.FC<InteractiveComponentProps> = ({ data, onUpdate, imageRef, isActive, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, componentX: 0, componentY: 0 });

  const geometry = getRenderedImageGeometry(imageRef);
  if (!geometry) return null;

  const displayX = geometry.offsetX + data.x * geometry.renderedWidth;
  const displayY = geometry.offsetY + data.y * geometry.renderedHeight;

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelect();
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      componentX: data.x,
      componentY: data.y,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const geometry = getRenderedImageGeometry(imageRef);
      if (!geometry) return;

      if (isDragging) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;

        let newX = dragStart.current.componentX + (dx / geometry.renderedWidth);
        let newY = dragStart.current.componentY + (dy / geometry.renderedHeight);

        // Constrain to 0-1 range
        newX = Math.max(0, Math.min(1, newX));
        newY = Math.max(0, Math.min(1, newY));

        onUpdate({ ...data, x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, data, onUpdate, imageRef]);

  const componentDisplayWidth = `${data.scale * 100}%`;

  return (
    <div
      onMouseDown={handleDragStart}
      className={`absolute group cursor-move select-none flex items-center justify-center border-2 ${isActive ? 'border-solid border-blue-500' : 'border-dashed border-transparent hover:border-blue-500/50'}`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: componentDisplayWidth,
        aspectRatio: '1 / 1',
        transform: `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.flipH ? -1 : 1}, ${data.flipV ? -1 : 1})`,
        transformOrigin: 'center center',
      }}
    >
      <img
        src={data.src}
        alt="Component Layer"
        className="max-w-full max-h-full object-contain pointer-events-none"
      />
    </div>
  );
};

export default InteractiveComponent;
