import { List } from './object-algebra'

describe('object-algebra List', () => {
  it('List.map produces a list of squares', () => {
    const numbers: List<number> = List.cons(3, List.cons(2, List.empty()))
    const squares = List.map(numbers, (n) => n * n)

    const actual = List.toArray(squares)
    expect(actual).toStrictEqual([9, 4])
  })

  it('Lists can be written as lambdas', () => {
    const numbers: List<number> = (L) => L.cons(3, L.cons(2, L.empty()))
    const squares = List.map(numbers, (n) => n * n)

    const actual = List.toArray(squares)
    expect(actual).toStrictEqual([9, 4])
  })
})
