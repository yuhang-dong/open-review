/**
 * Sample TypeScript file for testing
 */

export class Calculator {
	/**
	 * Add two numbers
	 */
	add(a: number, b: number): number {
		return a + b;
	}

	/**
	 * Subtract two numbers
	 */
	subtract(a: number, b: number): number {
		return a - b;
	}

	/**
	 * Multiply two numbers
	 */
	multiply(a: number, b: number): number {
		return a * b;
	}

	/**
	 * Divide two numbers
	 */
	divide(a: number, b: number): number {
		if (b === 0) {
			throw new Error('Cannot divide by zero');
		}
		return a / b;
	}
}

export function greet(name: string): string {
	return `Hello, ${name}!`;
}
