// Utils for managing resources and preventing memory leaks

export class ResourceManager {
  private static timers: Set<NodeJS.Timeout> = new Set();
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static abortControllers: Set<AbortController> = new Set();

  // Managed setTimeout
  static setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  // Managed setInterval
  static setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  // Create managed AbortController
  static createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    return controller;
  }

  // Clear specific timer
  static clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  // Clear specific interval
  static clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  // Cleanup all resources
  static cleanup(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Abort all pending requests
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers.clear();
  }

  // Get resource counts for monitoring
  static getResourceCounts() {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      abortControllers: this.abortControllers.size,
    };
  }
}

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ResourceManager.cleanup();
  });

  // Cleanup when tab becomes hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Cleanup non-essential resources when tab is hidden
      const counts = ResourceManager.getResourceCounts();
      if (counts.timers > 10 || counts.intervals > 5) {
        console.warn('High resource usage detected, cleaning up...');
        ResourceManager.cleanup();
      }
    }
  });
}

// Hook for automatic resource cleanup
export function useResourceCleanup() {
  const cleanup = () => {
    ResourceManager.cleanup();
  };

  // Return cleanup function that can be called manually
  return cleanup;
}

// Debounce function with automatic cleanup
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      ResourceManager.clearTimeout(timeoutId);
    }
    timeoutId = ResourceManager.setTimeout(() => {
      func(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      ResourceManager.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
}

// Throttle function with automatic cleanup
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  const throttledFunction = ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else if (!timeoutId) {
      timeoutId = ResourceManager.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  }) as T & { cancel: () => void };

  throttledFunction.cancel = () => {
    if (timeoutId) {
      ResourceManager.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFunction;
}
