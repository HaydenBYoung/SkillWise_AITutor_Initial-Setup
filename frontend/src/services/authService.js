import axios from 'axios';

/**
 * Attempt to sign up a user.
 * Returns { message } on success.
 * Throws an error object with { type, message, fields } on failure.
 */
export async function signup(payload) {
  try {
    const res = await axios.post('/signup', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    // assume server returns { message, ... }
    return res.data || { message: 'OK' };
  } catch (err) {
    // Network or no response
    if (!err.response) {
      const e = new Error('Network error or server not reachable');
      e.type = 'network';
      throw e;
    }

    const { status, data } = err.response;

    // 400/422 validation errors
    if (status === 422 || status === 400) {
      const e = new Error(data.message || 'Validation failed');
      e.type = 'validation';
      // data.errors expected to be { field: message }
      e.fields = data.errors || null;
      throw e;
    }

    if (status === 409) {
      const e = new Error(data.message || 'Conflict');
      e.type = 'conflict';
      throw e;
    }

    // generic server error
    const e = new Error(data.message || `Server error (${status})`);
    e.type = 'server';
    throw e;
  }
}
