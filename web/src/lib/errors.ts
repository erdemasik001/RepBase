import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'

const REVERT_REASONS: Record<string, string> = {
  SelfDealing: 'Owners cannot hire or rate their own agent.',
  NotAgentOwner: 'Only the agent owner can do this.',
  NotClient: 'Only the client who assigned the task can rate it.',
  InvalidStatus: 'This task is not in the right state for that action.',
  InvalidRating: 'Ratings must be between 1 and 5 stars.',
  InvalidLength: 'That text is empty or too long.',
  TaskNotFound: 'This task does not exist.',
}

/** Turns a wallet or contract error into one short sentence for the user. */
export function describeError(error: unknown): string {
  if (error instanceof BaseError) {
    if (error.walk((cause) => cause instanceof UserRejectedRequestError)) return 'Rejected in wallet.'

    const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName
      if (name && REVERT_REASONS[name]) return REVERT_REASONS[name]
    }
    return error.shortMessage
  }
  return error instanceof Error ? error.message : 'Something went wrong.'
}
