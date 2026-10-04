import { describe, expect, it, afterEach } from 'vitest'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CampusConnect frontend test setup', () => {
  it('runs Vitest correctly', () => {
    expect(true).toBe(true)
  })

  it('provides a browser-like DOM environment', () => {
    const element = document.createElement('div')
    element.textContent = 'CampusConnect'

    document.body.appendChild(element)

    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('CampusConnect')
  })
})
