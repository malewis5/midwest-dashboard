import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

// Create Supabase client with retries and better error handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-application-name': 'territory-management',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add custom error handler
supabase.handleError = (error: any) => {
  console.error('Supabase error:', error);

  // Check if it's a network error
  if (error.message === 'Failed to fetch') {
    return new Error(
      'Network error. Please check your connection and try again.'
    );
  }

  // Handle 406 errors gracefully
  if (error.status === 406) {
    return null; // Return null for "Not Acceptable" responses
  }

  // Handle other common errors
  if (error.code === 'PGRST116') {
    return null; // Not found, handle gracefully
  }

  if (error.code === '23505') {
    return null; // Duplicate key, handle gracefully
  }

  return error;
};

// Add retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();

      // Handle PGRST116 (not found) errors
      if (result && (result as any).error?.code === 'PGRST116') {
        throw new Error('Not found');
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if it's a "not found" error
      if (error.message === 'Not found' || error.code === 'PGRST116') {
        throw error;
      }

      // Don't retry if it's not a network error
      if (error.message !== 'Failed to fetch' && error.status !== 406) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError;
}

// Add helper for single-row queries that handles not found gracefully
export async function singleRow<T = any>(
  query: Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    return { data: data[0], error: null };
  } catch (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error };
  }
}

// Add helper for safe database operations
export async function safeQuery<T = any>(
  operation: () => Promise<{ data: T | null; error: any }>,
  defaultValue: T | null = null
): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await operation();

    if (error) {
      // Handle "not found" errors gracefully
      if (error.code === 'PGRST116') {
        return { data: defaultValue, error: null };
      }
      return { data: defaultValue, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: defaultValue, error };
  }
}
