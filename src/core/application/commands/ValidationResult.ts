/**
 * Represents the result of a command validation
 */
export class ValidationResult {
  private constructor(
    private readonly _isValid: boolean,
    private readonly _message?: string,
    private readonly _errors?: Map<string, string>
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true);
  }

  static error(message: string): ValidationResult {
    return new ValidationResult(false, message);
  }

  static errors(errors: Map<string, string>): ValidationResult {
    const messages = Array.from(errors.values()).join(', ');
    return new ValidationResult(false, messages, errors);
  }

  get isValid(): boolean {
    return this._isValid;
  }

  get message(): string {
    return this._message ?? '';
  }

  get errors(): Map<string, string> {
    return this._errors ?? new Map();
  }
}
