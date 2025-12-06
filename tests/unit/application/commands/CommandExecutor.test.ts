import { describe, it, expect, vi } from 'vitest';
import { CommandExecutor } from '../../../../src/core/application/commands/CommandExecutor';
import { ICommand } from '../../../../src/core/application/commands/ICommand';
import { ValidationResult } from '../../../../src/core/application/commands/ValidationResult';

// Mock command implementations for testing
class ValidCommand implements ICommand<string> {
  validate(): ValidationResult {
    return ValidationResult.success();
  }

  async execute(): Promise<string> {
    return 'Command executed successfully';
  }
}

class InvalidCommand implements ICommand<void> {
  constructor(private errorMessage: string) {}

  validate(): ValidationResult {
    return ValidationResult.error(this.errorMessage);
  }

  async execute(): Promise<void> {
    throw new Error('Should not be called');
  }
}

class InvalidCommandWithMultipleErrors implements ICommand<void> {
  validate(): ValidationResult {
    const errors = new Map<string, string>([
      ['field1', 'Field 1 is invalid'],
      ['field2', 'Field 2 is invalid'],
    ]);
    return ValidationResult.errors(errors);
  }

  async execute(): Promise<void> {
    throw new Error('Should not be called');
  }
}

class ThrowingCommand implements ICommand<void> {
  validate(): ValidationResult {
    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    throw new Error('Execution failed');
  }
}

class ThrowingNonErrorCommand implements ICommand<void> {
  validate(): ValidationResult {
    return ValidationResult.success();
  }

  async execute(): Promise<void> {
    throw 'String error'; // Non-Error object
  }
}

class AsyncCommand implements ICommand<number> {
  validate(): ValidationResult {
    return ValidationResult.success();
  }

  async execute(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 10));
    return 42;
  }
}

describe('CommandExecutor', () => {
  let executor: CommandExecutor;

  beforeEach(() => {
    executor = new CommandExecutor();
  });

  describe('execute - successful execution', () => {
    it('should execute valid command and return success', async () => {
      const command = new ValidCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBe('Command executed successfully');
      expect(result.error).toBeUndefined();
      expect(result.validationResult).toBeUndefined();
    });

    it('should execute async command and return result', async () => {
      const command = new AsyncCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBe(42);
    });

    it('should call validate before execute', async () => {
      const command = new ValidCommand();
      const validateSpy = vi.spyOn(command, 'validate');
      const executeSpy = vi.spyOn(command, 'execute');

      await executor.execute(command);

      expect(validateSpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalled();
      expect(validateSpy.mock.invocationCallOrder[0]).toBeLessThan(
        executeSpy.mock.invocationCallOrder[0]!
      );
    });

    it('should return success: true for successful execution', async () => {
      const command = new ValidCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
    });

    it('should include result in CommandResult', async () => {
      const command = new ValidCommand();
      const result = await executor.execute(command);

      expect(result.result).toBeDefined();
      expect(result.result).toBe('Command executed successfully');
    });
  });

  describe('execute - validation failure', () => {
    it('should not execute invalid command', async () => {
      const command = new InvalidCommand('Validation error');
      const executeSpy = vi.spyOn(command, 'execute');

      await executor.execute(command);

      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should return validation result for invalid command', async () => {
      const errorMessage = 'Validation error';
      const command = new InvalidCommand(errorMessage);
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
      expect(result.validationResult).toBeDefined();
      expect(result.validationResult!.isValid).toBe(false);
      expect(result.validationResult!.message).toBe(errorMessage);
    });

    it('should return success: false for validation failure', async () => {
      const command = new InvalidCommand('Error');
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
    });

    it('should not include result for validation failure', async () => {
      const command = new InvalidCommand('Error');
      const result = await executor.execute(command);

      expect(result.result).toBeUndefined();
    });

    it('should not include error for validation failure', async () => {
      const command = new InvalidCommand('Error');
      const result = await executor.execute(command);

      expect(result.error).toBeUndefined();
    });

    it('should handle multiple validation errors', async () => {
      const command = new InvalidCommandWithMultipleErrors();
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
      expect(result.validationResult).toBeDefined();
      expect(result.validationResult!.errors.size).toBe(2);
      expect(result.validationResult!.errors.get('field1')).toBe('Field 1 is invalid');
      expect(result.validationResult!.errors.get('field2')).toBe('Field 2 is invalid');
    });
  });

  describe('execute - execution errors', () => {
    it('should catch errors thrown during execution', async () => {
      const command = new ThrowingCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should return error message from thrown error', async () => {
      const command = new ThrowingCommand();
      const result = await executor.execute(command);

      expect(result.error?.message).toBe('Execution failed');
    });

    it('should not include result for execution error', async () => {
      const command = new ThrowingCommand();
      const result = await executor.execute(command);

      expect(result.result).toBeUndefined();
    });

    it('should not include validationResult for execution error', async () => {
      const command = new ThrowingCommand();
      const result = await executor.execute(command);

      expect(result.validationResult).toBeUndefined();
    });

    it('should wrap non-Error throws in Error object', async () => {
      const command = new ThrowingNonErrorCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('String error');
    });

    it('should handle async errors', async () => {
      class AsyncThrowingCommand implements ICommand<void> {
        validate() {
          return ValidationResult.success();
        }
        async execute() {
          await new Promise(resolve => setTimeout(resolve, 10));
          throw new Error('Async error');
        }
      }

      const command = new AsyncThrowingCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Async error');
    });
  });

  describe('execute - generic type handling', () => {
    it('should handle void return type', async () => {
      class VoidCommand implements ICommand<void> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<void> {
          // Do nothing
        }
      }

      const command = new VoidCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should handle number return type', async () => {
      class NumberCommand implements ICommand<number> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<number> {
          return 123;
        }
      }

      const command = new NumberCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBe(123);
    });

    it('should handle object return type', async () => {
      interface TestResult {
        id: number;
        name: string;
      }

      class ObjectCommand implements ICommand<TestResult> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<TestResult> {
          return { id: 1, name: 'test' };
        }
      }

      const command = new ObjectCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ id: 1, name: 'test' });
    });

    it('should handle array return type', async () => {
      class ArrayCommand implements ICommand<string[]> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<string[]> {
          return ['a', 'b', 'c'];
        }
      }

      const command = new ArrayCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('execute - edge cases', () => {
    it('should handle command that returns null', async () => {
      class NullCommand implements ICommand<null> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<null> {
          return null;
        }
      }

      const command = new NullCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });

    it('should handle command that returns undefined explicitly', async () => {
      class UndefinedCommand implements ICommand<undefined> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<undefined> {
          return undefined;
        }
      }

      const command = new UndefinedCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should handle command that returns boolean', async () => {
      class BooleanCommand implements ICommand<boolean> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<boolean> {
          return true;
        }
      }

      const command = new BooleanCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBe(true);
    });

    it('should handle very long running commands', async () => {
      class SlowCommand implements ICommand<string> {
        validate() {
          return ValidationResult.success();
        }
        async execute(): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'slow result';
        }
      }

      const command = new SlowCommand();
      const result = await executor.execute(command);

      expect(result.success).toBe(true);
      expect(result.result).toBe('slow result');
    }, 200);
  });

  describe('execute - concurrent execution', () => {
    it('should handle multiple concurrent commands', async () => {
      const command1 = new ValidCommand();
      const command2 = new AsyncCommand();
      const command3 = new ValidCommand();

      const results = await Promise.all([
        executor.execute(command1),
        executor.execute(command2),
        executor.execute(command3),
      ]);

      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
      expect(results[2]?.success).toBe(true);
      expect(results[1]?.result).toBe(42);
    });

    it('should not affect other commands when one fails validation', async () => {
      const validCommand = new ValidCommand();
      const invalidCommand = new InvalidCommand('Error');

      const results = await Promise.all([
        executor.execute(validCommand),
        executor.execute(invalidCommand),
      ]);

      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
    });

    it('should not affect other commands when one throws error', async () => {
      const validCommand = new ValidCommand();
      const throwingCommand = new ThrowingCommand();

      const results = await Promise.all([
        executor.execute(validCommand),
        executor.execute(throwingCommand),
      ]);

      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
    });
  });
});
