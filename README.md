yieldback
=========

# 목적

제너레이터를 사용해서 비동기적 코드를 동기적 코드처럼 작성할 수 있다
는 것을 보여줌에 중점을 두고 있습니다.  
물론 이 패키지도 작동하긴 합니다.

# 예제

`yieldback.scheduler` 사용
--------------------------

```node
function *Y() {
	// 지정된 숫자만큼 실행을 유예한다.
	yield 123;

	// 실행을 잠시 멈춘다. 다음 실행은 setImeediate 로 연기된다.
	yield;

	// 잠시 실행을 멈추나, 다음 실행은 setTimeout 로 연기된다.
	yield 0;


	// Promise 객체를 전달할 수도 있다.
	// Promise 가 resolve 된다면 그 값이 반환되고, reject 된다면 예외가 발생한다.
	var data = yield new Promise( ( resolve, reject ) => {
		// ...
	} );

	try {
		var data = yield getData();
		// ...
	} catch ( error ) {
		// error handling
	}


	// Promise 를 사용하되, composition 이 필요 없을 경우에는 
	// new Promise를 생략하고 exeuctor 만 보낼 수 있다.
	var data = yield ( resolve, reject ) => {
		// ...
	};

	// 참고: thenable이 가능하다면 Promise 객체라고 인식한다.


	// 또 다른 제너레이터 Y2를 호출할 수도 있다.
	// Y2의 리턴값은 ret에 할당된다.
	// yield 가 아니고 yield* 을 쓴다.
	var ret = yield* Y2();
	

	// 모든 비동기 작업이 완료되었을 때, 각각 작업의 결과를 배열에 담아 
	// 인자 순서대로 반환한다.
	// Promise.all 과 그 기능이 같다.
	//
	// scheduler 에게 yield 할 수 있는 모든 것을 배열에 담을 수 있다.
	yield [ p1, p2, p3 ];
	yield [ 1000, p1, p2 ];

	// 배열도 yield 가능하므로 배열을 중첩하여 보낼 수 있다.
	// 배열 자체가 하나의 비동기 작업으로 변환된다고 생각하면 쉽다.
	yield [ p1, p2, [ p3, p4, 1000 ], 2000 ];
	yield [ 100, [ 200, [ 300, [ 400 ] ] ] ];

	// 가장 먼저 완료되는 작업의 결과만을 얻고 싶을 때에는 
	// yieldback.race 함수로 배열을 래핑한다음 전달한다.
	// Promise.race 와 그 기능이 같다.
	// yieldback.any 와 yieldback.race 의 alias 이다.
	yield yieldback.race([ p1, p2, p3, p4 ]);
	yield yieldback.race([ p1, [ p2, p3 ], [ p4, p5 ] ]);
}

// scheduler 는 Promise 객체를 반환하여 Y() 반환 값을 가지고서
// 다시 채이닝을 시작할 수 있습니다.
yieldback.scheduler( Y() );
```

콜백 대용
----------

```node
class MyEmitter extends EventEmitter {
	// some code
}

var emt = new MyEmitter();

emt.on( "event", ( ...args ) => {
	// code 1
	setImmediate( () => {
		// code 2
	} );
} );

emt.on( "event", yieldback.yieldback( function* () {
	// 콜백 인자를 받는다.
	var args = yield;

	// code 1;

	// 콜백 호출 후 비동기적 실행을 할 필요가 없다면 아래 yield 를 주석처리
	// 하면 된다.
	yield;
	
	// code 2
} ) );
```

# 다른 패키지

`npm` 찾아보면 이 패키지보다 좋은 패키지가 많이 있을 것입니다.
