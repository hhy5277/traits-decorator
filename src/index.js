'use strict';

const _REF_ = Symbol();

function _filterKeys(key) {
    return !key.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/);
}

function _applyMethod(method, traitProto, subject, aliases, excluded) {
    _applyIfNotExcluded(method, traitProto, subject, aliases, excluded);   
}

function _raiseErrorIfConflict(methodName, traitProto, subjectProto) {
    let subjectMethod = subjectProto[methodName],
        traitMethod = traitProto[methodName],
        sameMethodName = (subjectMethod && traitMethod),
        methodsAreNotTheSame = sameMethodName && (subjectMethod.toString() !== traitMethod.toString());


    if ( sameMethodName && methodsAreNotTheSame ) {
        throw new Error('Method named: ' + methodName + ' is defined twice.' );
    }
}


function _applyIfNotExcluded(method, traitProto, subject, aliases, excluded) {

    if (excluded.indexOf(method) === -1) {
       
        let alias = aliases[method] || method;
       
        _raiseErrorIfConflict(alias, traitProto, subject);
       
        if (!subject[alias] || _isRequiredMethod(subject, alias)) {
            Object.defineProperty(subject, alias, Object.getOwnPropertyDescriptor(traitProto, method));
        }
    }
    
}

// trait or trait descriptor

function getReference() {
    return this[_REF_] || this;
}

function fromAliases() {
    return this.alias || {};
}

function fromExcludes() {
    return this.excludes || []
}
// --


function _apply(t) {
    let subject = this;
    let aliases = t::fromAliases();
    let excluded = t::fromExcludes();
    let ref = t::getReference();
    let tp = ref.prototype || ref;

    Object.getOwnPropertyNames(tp)
        .filter(_filterKeys)
        .forEach(function(method) {        
            _applyMethod(method, tp, subject, aliases, excluded);
        })
}

function addTrait(t) {
    let subject = this.prototype;
    subject::_apply(t);
}

function asDescriptor() {
    return (this.prototype || !this[_REF_] ? {[_REF_]: this} : this);
}


// PUBLIC API -----------------------------------

// decorators

/**
 * @decorator traits
 * Applies all traits as part of the target class.
 * @params Trait1, ...TraitN {Class|Object}
 * @usage
 *    
 *    @traits(TExample) class MyClass {}
 *    
 */
export function traits(...traitList) {

    return function (target) {
        traitList.forEach(function(trait){
            target::addTrait(trait)
        });
    }
}

/**
 * @decorator requires
 * Does Nothing. 
 * It's intended to describe / document what methods or properties should be provided by the host class.
 * @params Description1, ...DescriptionN {String}
 * @usage
 *
 * class TPrintCollection {
 * 
 *     @requires('collection')
 *     printCollection() {
 *         console.log(this.collection)
 *     }    
 * }    
 * 
 */
export function requires() {

    return function (target, name, descriptor) {  /*do nothing*/ };
}

/**
 * @decorator mixins
 * Applies all mixins as part of the target class using Object.assign.
 * @params Mixin1, ...MixinN {Object}
 * @usage
 *    
 *    @mixins(TExample) class MyClass {}
 *    
 */
export function mixins(...mixinsList) {
    return function (target) {
        Object.assign(target.prototype, ...mixinsList);
    }
}

// bindings

/**
 * @binding excludes
 * Excludes the list of methods from the Trait. This is intended to be used within @traits decorator.
 * @params MethodName1, ...MethodNameN {String}
 * @usage
 *
 * @traits(TExample::excludes('methodOne', 'menthodTwo')) class MyClass {}
 *
 */
export function excludes(...excludes) {
    let descriptor = this::asDescriptor();

    descriptor.excludes = excludes;

    return descriptor;
}

/**
 * @binding alias
 * Alias the methods defined as key from the Trait as value. This is intended to be used within @traits decorator.
 * @params alias {Object}
 * @usage
 *
 * @traits(TExample::alias({'methodOne': 'parentMethodOne'})) class MyClass {}
 *
 */
export function alias(aliases: {}) {
    let descriptor = this::asDescriptor();

    descriptor.alias = aliases;

    return descriptor;
}

/**
 * @binding as
 * Shortcut for excludes and alias. This is intended to be used within @traits decorator.
 * @params options {Object}
 * @oarams options.alias {Object}
 * @params options.exludes {String[]}
 * @usage
 *
 * @traits( TExample::as({ alias: {'methodOne': 'parentMethodOne'}, excludes: ['methodTwo'] }) ) class MyClass {}
 *
 */
export function as(options: {alias: {}, excludes: []}) {
    let descriptor = this::asDescriptor();

    descriptor
        ::alias(options.alias)
        ::excludes(...options.excludes);

    return descriptor;
}
