import { List } from './scott-encoding'

describe('scott-encoding List', () => {
  it('List.map produces a list of squares', () => {
    const numbers: List<number> = List.cons(3, List.cons(2, List.empty()))
    const squares = List.map(numbers, (n) => n * n)

    const actual = List.toArray(squares)
    expect(actual).toStrictEqual([9, 4])
  })
})
