import { ValidationResult } from './ValidationResult';

/**
 * Interface for commands that encapsulate user actions and business logic
 * @template TResult The type of result returned by the command execution
 */
export interface ICommand<TResult = void> {
  /**
   * Validates the command before execution
   * @returns ValidationResult indicating if the command can be executed
   */
  validate(): ValidationResult;

  /**
   * Executes the command
   * @returns Promise resolving to the command result
   */
  execute(): Promise<TResult>;
}
