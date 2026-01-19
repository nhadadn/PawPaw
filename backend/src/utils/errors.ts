export class CheckoutError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}
