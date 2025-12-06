import { ICommand } from './ICommand';
import { ValidationResult } from './ValidationResult';

/**
 * Result of command execution
 */
export interface CommandResult<T = void> {
  success: boolean;
  result?: T;
  error?: Error;
  validationResult?: ValidationResult;
}

/**
 * Executes commands with validation and error handling
 */
export class CommandExecutor {
  /**
   * Executes a command with validation
   * @param command The command to execute
   * @returns Promise resolving to the command result
   */
  async execute<TResult>(command: ICommand<TResult>): Promise<CommandResult<TResult>> {
    // Validate before execution
    const validation = command.validate();
    if (!validation.isValid) {
      return {
        success: false,
        validationResult: validation,
      };
    }

    // Execute command
    try {
      const result = await command.execute();
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
