import { GaxiosError } from 'gaxios';
import { z } from 'zod';

export namespace GoogleUtils {
  export const gaxiosErrorResponseSchema = z.object({
    data: z.object({
      error: z.string(),
      error_description: z.string(),
    }),
  });

  export const parseError = (
    error: unknown,
  ):
    | {
        success: true;
        message: string;
        error: string;
        error_description: string;
      }
    | {
        success: false;
        message: string;
      } => {
    if (error instanceof GaxiosError) {
      const result = gaxiosErrorResponseSchema.safeParse(error.response);
      if (result.success) {
        const { error, error_description } = result.data.data;
        return {
          success: true,
          message: `[${error}] ${error_description}`,
          error,
          error_description,
        };
      }
    }
    if (error instanceof Error) {
      return {
        success: false,
        message: `[${error.name}] ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Unknown error',
    };
  };
}
