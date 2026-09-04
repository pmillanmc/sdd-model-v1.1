import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator — pantalla y grid (T002)', () => {
  it('muestra 0 en pantalla al cargar', () => {
    render(<Calculator />)
    expect(screen.getByTestId('screen')).toHaveTextContent('0')
  })

  it('muestra todos los botones del grid', () => {
    render(<Calculator />)
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    for (const digit of digits) {
      expect(screen.getByRole('button', { name: digit })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: '.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '−' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '÷' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '=' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument()
  })
})

describe('Calculator — operaciones (T003)', () => {
  it('suma dos números y muestra el resultado al hacer click en =', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('12')
  })

  it('multiplica dos números y muestra el resultado', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: '×' }))
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('32')
  })

  it('soporta decimales', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('3.5')
  })

  it('resta dos números', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: '−' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('6')
  })
})

describe('Calculator — división por cero (T004)', () => {
  it('muestra Error al dividir por cero y sigue operativa después', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '÷' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('Error')

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('2')
  })
})

describe('Calculator — limpiar (T005)', () => {
  it('resetea a 0 desde un número parcial', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('button', { name: 'C' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('0')
  })

  it('resetea a 0 desde un estado de error', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '÷' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    await user.click(screen.getByRole('button', { name: 'C' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('0')
  })

  it('resetea a 0 desde un resultado', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    await user.click(screen.getByRole('button', { name: 'C' }))
    expect(screen.getByTestId('screen')).toHaveTextContent('0')
  })
})
