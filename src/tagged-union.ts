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
