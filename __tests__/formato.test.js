import { expect, test } from 'vitest'
import { formatearMoneda } from '@/lib/formato'

test('formatearMoneda formatea correctamente ARS', () => {
  const result = formatearMoneda(1234.5)
  expect(result).toContain('1.234')
  expect(result).toContain('50')
})

test('formatearMoneda maneja cero', () => {
  const result = formatearMoneda(0)
  expect(result).toContain('0')
})

test('formatearMoneda maneja string numérico', () => {
  const result = formatearMoneda('999.99')
  expect(result).toContain('999')
  expect(result).toContain('99')
})
