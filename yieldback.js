"use strict";

class Scheduler {
	constructor( resolve, reject, iterator ) {
		this.resolve = resolve;
		this.reject = reject;
		this.iterator = iterator;
		this.nextImmediately();
	}

	next( nextarg ) {
		var { done, value } = this.iterator.next( nextarg );
		if ( done ) {
			this.resolve( value );
		} else {
			this.yieldback( value );
		}
	}

	nextImmediately( nextarg ) {
		setImmediate( () => this.next( nextarg ) );
	}

	throw( error ) {
		if ( this.iterator.throw ) {
			let thrown;
			try {
				var { done, value } = this.iterator.throw( error );
				if ( done ) {
					this.resolve( value );
					return;
				}
			} catch ( error ) {
				this.reject( error );
				thrown = true;
			}
			if ( !thrown ) this.yieldback( value );
		} else {
			this.reject( error );
		}
	}

	throwImmediately( error ) {
		setImmediate( () => this.throw( error ) );
	}

	yieldback( value ) {
		if ( value === undefined || value === null ) {
			this.nextImmediately();
			return;
		}

		if ( typeof value === "number" ) {
			setTimeout( () => this.next(), value | 0 );
			return;
		}

		if ( Array.isArray( value ) ) {
			this.yieldPromise( Promise.all( value.map( reyield ) ) );
			return;
		}

		if ( value instanceof Function ) {
			this.yieldExecutor( value );
			return;
		}

		if ( value instanceof race ) {
			this.yieldPromise( Promise.race( value.its.map( reyield ) ) );
			return;
		}

		var iterator;
		if ( iterator = value[ Symbol.iterator ] ) {
			this.yieldPromise( scheduler( iterator ) );
			return;
		}

		if ( isPromise( value ) ) {
			this.yieldPromise( value );
			return;
		}

		this.yieldPromise();
	}

	yieldPromise( p ) {
		p.then( ( nextarg ) => {
			this.nextImmediately( nextarg );
		}, ( error ) => {
			this.throwImmediately( error );
		} );
	}

	yieldExecutor( executor ) {
		executor( ( value ) => {
			this.nextImmediately( value );
		}, ( error ) => {
			this.throwImmediately( error );
		} );
	}
}

function isPromise( obj ) {
	return obj.then instanceof Function
}

function reyield( elem ) {
	if ( isPromise( elem ) ) return elem;
	function* wrap() {
		return yield elem;
	}
	return scheduler( wrap() );
}

function race( its ) {
	if ( !( this instanceof race ) ) return new race( its );
	this.its = its;
}

var any = race;

function scheduler( iterator ) {
	return new Promise( ( resolve, reject ) => {
		new Scheduler( resolve, reject, iterator );
	} );
}

function yieldback( iterator ) {
	return ( ...args ) => {
		var it = iterator;
		if ( iterator instanceof Function ) {
			it = iterator();
		}

		var { done } = it.next();
		if ( done ) return;

		var { done } = it.next( args );
		if ( !done ) scheduler( it );
	};
}

exports.scheduler = scheduler;

exports.yieldback = yieldback;

exports.race = race;

exports.any = any;
