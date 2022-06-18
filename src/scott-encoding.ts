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
