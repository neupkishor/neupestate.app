import logica from '@neup/logica';

export async function logRequirementApiFailure(
  operation: string,
  request: unknown,
  failure: { response?: unknown; error?: unknown },
): Promise<void> {
  try {
    await logica.logger()
      .type(`estate.requirement.${operation}`)
      .error({ request, ...failure });
  } catch (loggingError) {
    console.warn('[requirements] unable to send failure to logica.logger', loggingError);
  }
}
