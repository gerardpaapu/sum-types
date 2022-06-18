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

export const List = { map, toArray, cons, empty }
