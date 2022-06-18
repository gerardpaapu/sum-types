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
