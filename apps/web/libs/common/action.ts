export const requiredAction = <T>(payload?: { data?: T; serverError?: string }): { data: T } => {
  if (payload === undefined) {
    throw new Error('Resource not found');
  } else if (payload.serverError !== undefined) {
    throw new Error(payload.serverError);
  } else if (payload.data === undefined) {
    throw new Error('Resource not found');
  }

  return { ...payload, data: payload.data };
};
