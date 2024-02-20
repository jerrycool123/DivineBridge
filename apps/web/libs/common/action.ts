export const requiredAction = <T extends { data?: D; serverError?: string }, D>(
  payload: T,
): T & Required<Pick<T, 'data'>> => {
  if (payload.serverError !== undefined) {
    throw new Error(payload.serverError);
  } else if (payload.data === undefined) {
    throw new Error('Resource not found');
  }
  return { ...payload, data: payload.data };
};
