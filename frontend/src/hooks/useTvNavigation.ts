'use client';

import { useState, useEffect, useCallback } from 'react';

interface TvNavigationProps {
  sidebarCount: number;
  rowCount: number;
  rowLengths: number[];
  modalButtonsCount: number;
  initialZone?: 'sidebar' | 'hero' | 'grid' | 'modal';
}

export function useTvNavigation({
  sidebarCount,
  rowCount,
  rowLengths,
  modalButtonsCount,
  initialZone = 'grid',
}: TvNavigationProps) {
  const [zone, setZone] = useState<'sidebar' | 'hero' | 'grid' | 'modal'>(initialZone);
  const [sidebarIdx, setSidebarIdx] = useState(1); // Default to "Home" (index 1)
  const [gridRow, setGridRow] = useState(0);
  const [gridCol, setGridCol] = useState(0);
  const [modalIdx, setModalIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to open/close modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setZone('modal');
    setModalIdx(0);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setZone('grid');
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If a video player is active (full screen), ignore spatial navigation
      if (document.querySelector('.fixed.inset-0.w-screen.h-screen.bg-black.z-50')) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (zone === 'sidebar') {
            setSidebarIdx((prev) => Math.max(0, prev - 1));
          } else if (zone === 'grid') {
            if (gridRow > 0) {
              setGridRow((prev) => prev - 1);
              // Bound check column index for the new row
              const newRowLen = rowLengths[gridRow - 1] || 0;
              setGridCol((prev) => Math.min(prev, newRowLen - 1));
            } else {
              setZone('hero');
            }
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (zone === 'sidebar') {
            setSidebarIdx((prev) => Math.min(sidebarCount - 1, prev + 1));
          } else if (zone === 'hero') {
            if (rowCount > 0) {
              setZone('grid');
              setGridRow(0);
              setGridCol(0);
            }
          } else if (zone === 'grid') {
            if (gridRow < rowCount - 1) {
              setGridRow((prev) => prev + 1);
              // Bound check column index for the new row
              const newRowLen = rowLengths[gridRow + 1] || 0;
              setGridCol((prev) => Math.min(prev, newRowLen - 1));
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (zone === 'hero') {
            setZone('sidebar');
          } else if (zone === 'grid') {
            if (gridCol > 0) {
              setGridCol((prev) => prev - 1);
            } else {
              setZone('sidebar');
            }
          } else if (zone === 'modal') {
            setModalIdx((prev) => Math.max(0, prev - 1));
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (zone === 'sidebar') {
            // Restore context when moving right from sidebar
            if (gridRow === -1) {
              setZone('hero');
            } else {
              setZone('grid');
            }
          } else if (zone === 'grid') {
            const currentRowLen = rowLengths[gridRow] || 0;
            if (gridCol < currentRowLen - 1) {
              setGridCol((prev) => prev + 1);
            }
          } else if (zone === 'modal') {
            setModalIdx((prev) => Math.min(modalButtonsCount - 1, prev + 1));
          }
          break;

        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (zone === 'modal') {
            closeModal();
          }
          break;

        default:
          break;
      }
    },
    [zone, sidebarIdx, gridRow, gridCol, modalIdx, rowLengths, sidebarCount, rowCount, modalButtonsCount, closeModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    zone,
    setZone,
    sidebarIdx,
    setSidebarIdx,
    gridRow,
    setGridRow,
    gridCol,
    setGridCol,
    modalIdx,
    setModalIdx,
    isModalOpen,
    openModal,
    closeModal,
  };
}
