import { Logger } from '@nestjs/common';

type handleSocketErrorTypes = {
  error: unknown;
  logger: Logger;
  ack: ({ success, error }) => void;
};

export function handleSocketError({
  error,
  logger,
  ack,
}: handleSocketErrorTypes) {
  logger.error(error, error);

  if (error instanceof Error)
    return ack({ success: false, error: error.message });

  return ack({ success: false, error: 'Something went wrong!' });
}
