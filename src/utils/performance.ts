// Performance monitoring utilities
import React from 'react';
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();
  private static marks = new Map<string, number>();

  // Start timing a performance measurement
  static startTiming(label: string): void {
    this.marks.set(label, performance.now());
  }

  // End timing and log the result
  static endTiming(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start time found for label: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.set(label, duration);
    
    // Log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }

    this.marks.delete(label);
    return duration;
  }

  // Get measurement for a label
  static getMeasurement(label: string): number | undefined {
    return this.measurements.get(label);
  }

  // Get all measurements
  static getAllMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements);
  }

  // Clear all measurements
  static clearMeasurements(): void {
    this.measurements.clear();
    this.marks.clear();
  }

  // Measure async function execution
  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTiming(label);
    try {
      const result = await fn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Measure sync function execution
  static measure<T>(label: string, fn: () => T): T {
    this.startTiming(label);
    try {
      const result = fn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }
}

// React performance utilities
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    PerformanceMonitor.startTiming(`${componentName}-render`);
    
    React.useEffect(() => {
      PerformanceMonitor.endTiming(`${componentName}-render`);
    });

    return React.createElement(Component, props);
  });
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100,
    };
  }
  return null;
};

// Bundle size monitoring
export const logBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle size monitoring enabled in development');
  }
};

export default PerformanceMonitor;
