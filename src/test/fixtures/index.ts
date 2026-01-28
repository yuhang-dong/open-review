/**
 * Test fixtures and sample data for testing
 */

export * from './ThreadBuilder';

/**
 * Sample TypeScript file content
 */
export const SAMPLE_TYPESCRIPT = `/**
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
	return \`Hello, \${name}!\`;
}
`;

/**
 * Sample JavaScript file content
 */
export const SAMPLE_JAVASCRIPT = `/**
 * Sample JavaScript file for testing
 */

function greet(name) {
	return 'Hello, ' + name + '!';
}

function sum(numbers) {
	return numbers.reduce((acc, num) => acc + num, 0);
}

function isEven(num) {
	return num % 2 === 0;
}

module.exports = {
	greet,
	sum,
	isEven
};
`;

/**
 * Sample Python file content
 */
export const SAMPLE_PYTHON = `"""
Sample Python file for testing
"""

def fibonacci(n):
    """Calculate the nth Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    """Calculate the factorial of n"""
    if n <= 1:
        return 1
    return n * factorial(n-1)

def is_prime(n):
    """Check if a number is prime"""
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
`;
