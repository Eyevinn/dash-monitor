/**
 * Fixed-size FIFO error storage
 */
import { MonitorError } from './types';
import { v4 as uuidv4 } from 'uuid';

export class ErrorsList {
  private errors: MonitorError[] = [];
  private limit: number;

  constructor(limit: number = 10) {
    this.limit = limit;
  }

  /**
   * Add an error to the list
   * If limit is exceeded, removes oldest error (FIFO)
   */
  add(error: MonitorError): void {
    // Ensure error has an ID
    if (!error.id) {
      error.id = uuidv4();
    }

    this.errors.push(error);

    // Remove oldest if over limit
    if (this.errors.length > this.limit) {
      this.errors.shift();
    }
  }

  /**
   * Get all errors
   */
  getAll(): MonitorError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get error count
   */
  count(): number {
    return this.errors.length;
  }
}
