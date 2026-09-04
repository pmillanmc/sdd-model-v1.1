import { useState } from 'react'
import './Calculator.css'

type Operator = '+' | '−' | '×' | '÷'

interface PendingOperation {
  previousValue: number
  operator: Operator
}

function applyOperator(a: number, b: number, operator: Operator): number | null {
  switch (operator) {
    case '+':
      return a + b
    case '−':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? null : a / b
  }
}

export function Calculator() {
  const [display, setDisplay] = useState('0')
  const [pending, setPending] = useState<PendingOperation | null>(null)
  const [isError, setIsError] = useState(false)
  const [startingFresh, setStartingFresh] = useState(true)

  function handleDigit(digit: string) {
    if (isError || startingFresh) {
      setDisplay(digit)
      setStartingFresh(false)
      setIsError(false)
      return
    }
    setDisplay(display === '0' ? digit : display + digit)
  }

  function handleDecimalPoint() {
    if (isError) {
      setDisplay('0.')
      setStartingFresh(false)
      setIsError(false)
      return
    }
    if (startingFresh) {
      setDisplay('0.')
      setStartingFresh(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  function handleOperator(operator: Operator) {
    if (isError) return
    setPending({ previousValue: Number(display), operator })
    setStartingFresh(true)
  }

  function handleEquals() {
    if (isError || !pending) return
    const result = applyOperator(pending.previousValue, Number(display), pending.operator)
    if (result === null) {
      setIsError(true)
      setDisplay('Error')
    } else {
      setDisplay(String(result))
    }
    setPending(null)
    setStartingFresh(true)
  }

  function handleClear() {
    setDisplay('0')
    setPending(null)
    setIsError(false)
    setStartingFresh(true)
  }

  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0']
  const operators: Operator[] = ['+', '−', '×', '÷']

  return (
    <div className="calculator">
      <div className="screen" data-testid="screen">
        {display}
      </div>
      <div className="grid">
        <button type="button" className="btn btn-clear" onClick={handleClear}>
          C
        </button>
        {operators.map((op) => (
          <button
            key={op}
            type="button"
            className="btn btn-operator"
            onClick={() => handleOperator(op)}
          >
            {op}
          </button>
        ))}
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            className="btn btn-digit"
            onClick={() => handleDigit(digit)}
          >
            {digit}
          </button>
        ))}
        <button type="button" className="btn btn-digit" onClick={handleDecimalPoint}>
          .
        </button>
        <button type="button" className="btn btn-equals" onClick={handleEquals}>
          =
        </button>
      </div>
    </div>
  )
}
