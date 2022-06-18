# Representing Sum types in Typescript

Sum types are a big part of the culture of typed functional programming.

When we write typescript in the functional style, there can be a mismatch
between OOP representations and functional strategies. One reason is that OOP
languages and functional languages tend toward either side of the expression
problem.

> The expression problem is a new name for an old problem. The goal is to define
> a datatype by cases, where one can add new cases to the datatype and new
> functions over the datatype, without recompiling existing code, and while
> retaining static type safety (e.g., no casts).
> -- [Phillip Wadler](http://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt)

Classes are on one side of the problem: it's very easy to add new cases, and very hard to
add new functions.

Sum types are on the other side of the problem: it's very hard to add new cases and very
easy to add new functions.

We'll look at a few ways to represent sum types in Typescript that reduce that
mismatch. As an example for each method, I'll use a `List` type constructor
together with `map` as defined for `List`.

> NB: This is not an endorsement of singly-linked lists for any specific
> use-case

This is what a definition might look like in haskell

```haskell
data List a = Cons a (List a) | Empty

map :: (a -> b) -> List a -> List b
map f m = case m of
    Cons head tail -> Cons (f head) (map f tail)
    Empty -> Empty
```

Haskell and other ML family languages define a constructor for each case, but
for typescript we will manually define constructors `cons` and `empty`.

> NB: this implementation of map is not the most efficient but I'll follow it
> for all of the typescript examples because it's clear.

I've used camelCase rather than PascalCase because they are neither types nor
classes, so this is inline with existing JS conventions.

I'm also going to flip the order of arguments to map because Javascript doesn't
have auto-currying so it's more idiomatic to have the data structure first.

Finally, I'll provide a conversion to native Javascript arrays called `toArray`
in each example.

## Tagged Union

Unions in typescript are constructed with the `|` operator. To represent a
discriminated union, I might use a union of record types with a discriminant
property `"type"` (you can use any key here but it helps to have a convention).

The map function demonstrates that we destructure an instance of `List<T>`
by switching on the discriminant property. In the case branch typescript will
narrow the type of that value to the appropriate member of the union.

```typescript
export type List<T> =
  | { type: 'Cons'; head: T; tail: List<T> }
  | { type: 'Empty' }

export const empty = (): List<any> => ({ type: 'Empty' })

export const cons = <T>(head: T, tail: List<T>): List<T> => ({
  type: 'Cons',
  head,
  tail,
})

export const map = <A, B>(list: List<A>, f: (a: A) => B): List<B> => {
  switch (list.type) {
    case 'Empty':
      return empty()

    case 'Cons':
      return cons(f(list.head), map(list.tail, f))
  }
}

export const toArray = <T>(list: List<T>): T[] => {
  switch (list.type) {
    case 'Empty':
      return []

    case 'Cons':
      return [list.head, ...toArray(list.tail)]
  }
}

export const List = { empty, cons, map, toArray }
```

In a consuming module, you would use it like this.

```typescript
import { List } from './List'

const numbers: List<number> = List.cons(3, List.cons(2, List.empty()))
const squares = List.map(numbers, (n) => n * n)

export const result = List.toArray(squares) // = [9, 4]
```

> In practice you might wrap these values in objects that provide javascript
> style methods like `squares = numbers.map(n => n * n )`. I'm not going to
> cover that here because it doesn't affect the representation

Redux actions are typically written in a style similar to this.

Values represented in this style are likely to be serialisable, and are [eagerly evaluated](https://en.wikipedia.org/wiki/Eager_evaluation).

## Scott Encoding

Another method is to invert the question, "how is a List T represented" and
focus instead on "how will a List T be used".

To convert a `List<number>` to some `Result` we have to consider two cases:

1. We have a head and tail, so we examine them to produce a `Result`
2. We have an empty list so we'll use some fallback method to generate a `Result`

We can represent each of these cases as a function:

1. `(head: T, tail: List<T>) => Result`
2. `() => Result`

then we can represent a Maybe value as a function that calls one of these two
functions to achieve a `Result`.

This is known as [Scott Encoding](https://en.wikipedia.org/wiki/Mogensen%E2%80%93Scott_encoding) and is similar to [Church Encoding](https://en.wikipedia.org/wiki/Church_encoding).

```typescript
export type ListCases<T> = <Result>(
  onEmpty: () => Result,
  onCons: (head: T, tail: List<T>) => Result
) => Result

export type List<T> = { caseOf: ListCases<T> }
export const empty = (): List<any> => ({ caseOf: (f) => f() })
export const cons = <T>(head: T, tail: List<T>): List<T> => ({
  caseOf: (_, f) => f(head, tail),
})

export const map = <A, B>(list: List<A>, f: (a: A) => B): List<B> => ({
  caseOf: (onEmpty, onCons) =>
    list.caseOf(
      () => onEmpty(),
      (head, tail) => onCons(f(head), map(tail, f))
    ),
})

export const toArray = <T>(list: List<T>): T[] =>
  list.caseOf(
    () => [],
    (head, tail) => [head, ...toArray(tail)]
  )

export const List = { empty, cons, map, toArray }
```

An equivalent strategy is to use object keys instead of positional arguments,
you might prefer the ergonomics of destructuring this especially if your sum
type has many constructors.

```typescript
type ListCases<T> = <Result>(_: {
  Empty: () => Result
  Cons: (head: T, tail: List<T>) => Result
}) => Result

export type List<T> = { caseOf: ListCases<T> }

export const empty = (): List<any> => ({ caseOf: ({ Empty }) => Empty() })
export const cons = <T>(head: T, tail: List<T>): List<T> => ({
  caseOf: ({ Cons }) => Cons(head, tail),
})

export const map = <A, B>(list: List<A>, f: (a: A) => B): List<B> => ({
  caseOf: ({ Cons, Empty }) =>
    list.caseOf({
      Empty: () => Empty(),
      Cons: (head, tail) => Cons(f(head), map(tail, f)),
    }),
})

export const toArray = <T>(list: List<T>): T[] =>
  list.caseOf({
    Empty: () => [],
    Cons: (head, tail) => [head, ...toArray(tail)],
  })

export const List = { empty, cons, map, toArray }
```

Calling `cons`, `empty` and `map` here has the same API as discriminated union,
but if you take a look at the implementations of `map` you'll see that
destructuring manually looks pretty different.

```typescript
import { List } from './List'

const numbers: List<number> = List.cons(3, List.cons(2, List.empty()))
const squares = List.map(numbers, (n) => n * n)

export const result = List.toArray(squares) // = [9, 4]
```

Values represented in this style are typically not serialisable
and are [lazily evaluated](https://en.wikipedia.org/wiki/Lazy_evaluation).

Repeated operations may generate deep call-stacks, so it's worth thinking about
strategies to mitigate this.

[daggy](https://www.npmjs.com/package/daggy) provides utilities for constructing
types like this, though the internals differ for performance reasons.

## Object Algebra

This approach is described in [Extensibility for the
Masses](https://www.cs.utexas.edu/~wcook/Drafts/2012/ecoop2012.pdf) as a
solution to the expression problem that works in Object-Oriented languages with
simple generics (including Java and C?).

Of course, since typescript also supports generics we can use Object Algebra.

Similar to Scott encoding we define a type of the methods needed to map each
member of the sum type to some result, aka. an algebra. Each method on the
interface should return a value of the type-parameter (in our case `ListT`)
and where the type would be recursive it uses `ListT` instead.

Then we can define a `List<T>` as a function from an algebra to some type of
result.

Recursion is where these look really different, the implementation of map is
somehow... not recursive?

```typescript
export interface ListAlg<T, ListT> {
  empty(): ListT
  cons(head: T, tail: ListT): ListT
}

export type List<T> = <Result>(_: ListAlg<T, Result>) => Result

export const empty =
  <T>(): List<T> =>
  (L) =>
    L.empty()
export const cons =
  <T>(first: T, rest: List<T>): List<T> =>
  (L) =>
    L.cons(first, rest(L))

export const map = <A, B>(list: List<A>, f: (a: A) => B): List<B> =>
  list({
    empty: () => empty(),
    cons: (head, tail) => cons(f(head), tail),
  })

export const toArray = <T>(list: List<T>): T[] =>
  list({
    empty: () => [] as T[],
    cons: (head, tail) => [head, ...tail],
  })

export const List = { map, toArray, empty, cons }
```

We can also write map as explicitly returning a function, rather then use the
`cons` and `empty` constructors.

```typescript
export const map =
  <A, B>(list: List<A>, f: (a: A) => B): List<B> =>
  (L) =>
    list({
      empty: () => L.empty(),
      cons: (head, tail) => L.cons(f(head), tail),
    })
```

For our example, consuming the module it can either look like all the others.

```typescript
import { List } from './List'

const numbers = List.cons(3, List.cons(2, List.empty()))
const squares = List.map(numbers, (n) => n * n)

export const result = List.toArray(squares) // = [9, 4]
```

... or we can contruct our lists as function expressions.

```typescript
import { List } from './List'

const numbers: List<number> = (L) => L.cons(3, L.cons(2, L.empty()))
const squares = List.map(numbers, (n) => n * n)

export const result = List.toArray(squares) // = [9, 4]
```

Like Scott-encoding, representing objects this way leads to lazy-evaluation.
Serialisation is a little easier but it's not quite free.

Object algebra really come into their own when you're using them to represent an
[Embedded Domain Specific language](https://wiki.c2.com/?EmbeddedDomainSpecificLanguage) in your application.

There's a huge amount of additional power in them that isn't immediately obvious
for this use-case so I'll be writing about them again soon. If you're interested
check out some of the other papers on the topic.

- [Scrap Your Boilerplate with Object Algebras](https://i.cs.hku.hk/~bruno/papers/oopsla2015.pdf)
- [Extensible Language Implementation with Object Algebras](https://homepages.cwi.nl/~storm/publications/eli-oalg-gpce14.pdf)

---

If you read it this far, you get [example code](https://github.com/gerardpaapu/sum-types)

Each of these strategies are useful in different contexts. I would recommend
tagged-union for _most_ use cases. Especially if you want to convert your sum
type to and from JSON easily.

Scott encoding implementations can be great when you need laziness, e.g. for
infinite data-structures.

Object algebra are fantastic for when you're representing a language, especially
when you need to support multiple interpreters or compilers.

Let me know if you use sum types differently in typescript.
