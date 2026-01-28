/**
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
