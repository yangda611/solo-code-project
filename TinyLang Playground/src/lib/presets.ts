export interface Preset {
	id: string;
	name: string;
	description: string;
	code: string;
	category: 'algorithm' | 'error' | 'feature';
}

export const presets: Preset[] = [
	{
		id: 'fibonacci-recursive',
		name: '斐波那契递归',
		description: '使用递归方式计算斐波那契数列',
		category: 'algorithm',
		code: `// 斐波那契数列递归实现
fn fib(n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

let result = fib(10);
print("fib(10) = " + result);
print("斐波那契数列前10项:");
for (let i = 0; i < 10; i = i + 1) {
    print("fib(" + i + ") = " + fib(i));
}`
	},
	{
		id: 'infinite-loop',
		name: '死循环检测',
		description: '演示系统如何检测和终止死循环',
		category: 'error',
		code: `// 死循环检测演示
// 系统会在超过最大步数后终止执行
let count = 0;

while (true) {
    count = count + 1;
    if (count % 1000 == 0) {
        print("已执行 " + count + " 次");
    }
}

// 这行代码永远不会执行
print("程序结束");`
	},
	{
		id: 'array-index-out-of-bounds',
		name: '数组越界错误',
		description: '演示数组索引越界的错误处理和定位',
		category: 'error',
		code: `// 数组越界错误演示
let arr = [1, 2, 3, 4, 5];
print("数组长度: " + len(arr));
print("数组元素:");

for (let i = 0; i < len(arr); i = i + 1) {
    print("arr[" + i + "] = " + arr[i]);
}

// 尝试访问越界索引
print("访问 arr[10]:");
let value = arr[10];
print("值: " + value);`
	},
	{
		id: 'function-scope',
		name: '函数作用域演示',
		description: '演示函数作用域、闭包和变量遮蔽',
		category: 'feature',
		code: `// 函数作用域演示
let x = 10;
print("全局 x = " + x);

fn outer() {
    let x = 20;
    print("outer x = " + x);
    
    fn inner() {
        let x = 30;
        print("inner x = " + x);
    }
    
    inner();
    print("outer x 仍然是 " + x);
}

outer();
print("全局 x 仍然是 " + x);

// 闭包演示
fn createCounter() {
    let count = 0;
    
    fn increment() {
        count = count + 1;
        return count;
    }
    
    return increment;
}

let counter = createCounter();
print("counter(): " + counter());
print("counter(): " + counter());
print("counter(): " + counter());`
	}
];

export function getPresetById(id: string): Preset | undefined {
	return presets.find((p) => p.id === id);
}
