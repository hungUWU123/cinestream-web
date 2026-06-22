'use client';

import { useState, useEffect, useCallback } from 'react';

interface TvNavigationProps {
  sidebarCount: number;
  rowCount: number;
  rowLengths: number[];
  modalButtonsCount: number;
  initialZone?: 'sidebar' | 'hero' | 'grid' | 'modal' | 'search-input' | 'keyboard' | 'login-qr';
  isAuthenticated?: boolean;
  sidebarIdx: number;
  setSidebarIdx: React.Dispatch<React.SetStateAction<number>>;
}

export function useTvNavigation({
  sidebarCount,
  rowCount,
  rowLengths,
  modalButtonsCount,
  initialZone = 'grid',
  isAuthenticated = true,
  sidebarIdx,
  setSidebarIdx,
}: TvNavigationProps) {
  const [zone, setZone] = useState<'sidebar' | 'hero' | 'grid' | 'modal' | 'search-input' | 'keyboard' | 'login-qr'>(initialZone);
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
    if (sidebarIdx === 0) {
      setZone('search-input');
    } else {
      setZone('grid');
    }
  }, [sidebarIdx]);

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
              if (sidebarIdx === 0) {
                setZone('keyboard');
                setGridRow(3); // Go to last row of keyboard (row index 3)
                setGridCol(0);
              } else {
                setZone('hero');
              }
            }
          } else if (zone === 'keyboard') {
            if (gridRow > 0) {
              setGridRow((prev) => prev - 1);
              const newRowLen = [10, 10, 10, 9][gridRow - 1];
              setGridCol((prev) => Math.min(prev, newRowLen - 1));
            } else {
              setZone('search-input');
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
          } else if (zone === 'search-input') {
            setZone('keyboard');
            setGridRow(0);
            setGridCol(0);
          } else if (zone === 'keyboard') {
            if (gridRow < 3) { // 4 rows total (0, 1, 2, 3)
              setGridRow((prev) => prev + 1);
              const newRowLen = [10, 10, 10, 9][gridRow + 1];
              setGridCol((prev) => Math.min(prev, newRowLen - 1));
            } else {
              if (rowCount > 0 && (rowLengths[0] || 0) > 0) {
                setZone('grid');
                setGridRow(0);
                setGridCol(0);
              }
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (zone === 'hero' || zone === 'search-input' || zone === 'login-qr') {
            setZone('sidebar');
          } else if (zone === 'grid') {
            if (gridCol > 0) {
              setGridCol((prev) => prev - 1);
            } else {
              setZone('sidebar');
            }
          } else if (zone === 'keyboard') {
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
            if (sidebarIdx === 0) {
              setZone('search-input');
            } else if (sidebarIdx === 2) {
              if (isAuthenticated) {
                if (rowCount > 0 && (rowLengths[0] || 0) > 0) {
                  setZone('grid');
                  setGridRow(0);
                  setGridCol(0);
                }
              } else {
                setZone('login-qr');
              }
            } else if (gridRow === -1) {
              setZone('hero');
            } else {
              setZone('grid');
            }
          } else if (zone === 'grid') {
            const currentRowLen = rowLengths[gridRow] || 0;
            if (gridCol < currentRowLen - 1) {
              setGridCol((prev) => prev + 1);
            }
          } else if (zone === 'keyboard') {
            const currentRowLen = [10, 10, 10, 9][gridRow];
            if (gridCol < currentRowLen - 1) {
              setGridCol((prev) => prev + 1);
            }
          } else if (zone === 'modal') {
            setModalIdx((prev) => Math.min(modalButtonsCount - 1, prev + 1));
          }
          break;

        case 'Escape':
        case 'Backspace':
          if (zone === 'modal') {
            e.preventDefault();
            closeModal();
          }
          break;

        default:
          break;
      }
    },
    [zone, sidebarIdx, setSidebarIdx, gridRow, gridCol, modalIdx, rowLengths, sidebarCount, rowCount, modalButtonsCount, closeModal, isAuthenticated]
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
