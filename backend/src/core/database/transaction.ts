import mongoose, { ClientSession } from 'mongoose';

/**
 * Executes an operation inside a MongoDB transaction session.
 * Gracefully degrades on standalone MongoDB instances in local development/CI
 * by falling back to session-less execution if replica sets are not enabled.
 */
export async function withTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    let session: ClientSession | null = null;
    try {
      session = await mongoose.startSession();
    } catch {
      // Cannot start session (e.g. standalone connection)
      return await fn();
    }

    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err: any) {
      const errorStr =
        (err?.message || '') +
        ' ' +
        (err?.originalError?.message || '') +
        ' ' +
        (err?.errorResponse?.errmsg || '');
      const isStandaloneError =
        errorStr.includes('replica set') ||
        errorStr.includes('standalone') ||
        errorStr.includes('Transaction numbers are only allowed') ||
        errorStr.includes('does not support retryable writes');

      try {
        await session.abortTransaction();
      } catch {
        // Ignore abort errors
      }

      if (isStandaloneError) {
        return await fn();
      }

      const hasTransientLabel =
        err?.errorLabels?.includes('TransientTransactionError') ||
        err?.errorResponse?.errorLabels?.includes('TransientTransactionError') ||
        err?.code === 24 || // LockTimeout
        err?.code === 112; // WriteConflict

      if (hasTransientLabel && attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
        continue;
      }

      throw err;
    } finally {
      try {
        await session.endSession();
      } catch {
        // Ignore endSession errors
      }
    }
  }
  throw new Error('Transaction failed after maximum retries');
}

