'use client';

import { DndProvider as DndProviderBase } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function DndProvider({ children }) {
  return (
    <DndProviderBase backend={HTML5Backend}>
      {children}
    </DndProviderBase>
  );
}

