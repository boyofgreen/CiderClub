import { describe, it, expect } from 'vitest'
import { parseCsv } from '@/lib/csv'

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields with commas, newlines, and escaped quotes', () => {
    const csv = 'name,notes\n"Smith, Jane","Likes ""dry"" cider\nVIP member"'
    expect(parseCsv(csv)).toEqual([
      ['name', 'notes'],
      ['Smith, Jane', 'Likes "dry" cider\nVIP member'],
    ])
  })

  it('handles CRLF line endings and trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('skips blank lines', () => {
    expect(parseCsv('a,b\n\n1,2\n,\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('preserves empty fields', () => {
    expect(parseCsv('a,,c')).toEqual([['a', '', 'c']])
  })
})
