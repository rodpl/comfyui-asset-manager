let lockCount = 0;

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  document.body.style.overflow = 'hidden';
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount > 0) lockCount -= 1;
  document.body.style.overflow = lockCount > 0 ? 'hidden' : 'unset';
}

export function resetBodyScrollLock(): void {
  lockCount = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'unset';
  }
}


