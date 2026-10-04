import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../pages/Login'

const loginMock = vi.hoisted(() => vi.fn())
const switchDemoRoleMock = vi.hoisted(() => vi.fn())
const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: loginMock,
    logout: vi.fn(),
    switchDemoRole: switchDemoRoleMock,
    demoUsers: [],
    refreshProfile: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('CampusConnect login page', () => {
  beforeEach(() => {
    loginMock.mockReset()
    switchDemoRoleMock.mockReset()
    navigateMock.mockReset()

    loginMock.mockResolvedValue(undefined)
    switchDemoRoleMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('submits the login form and navigates to the dashboard', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('name@campusconnect.edu'), {
      target: { value: 'admin@campusconnect.edu' },
    })

    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'AdminPassword@123' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Sign In to Portal/i }),
    )

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        'admin@campusconnect.edu',
        'AdminPassword@123',
      )
    })

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/')
    })
  })

  it('shows the backend error when login fails', async () => {
    loginMock.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('name@campusconnect.edu'), {
      target: { value: 'wrong@example.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'WrongPassword' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Sign In to Portal/i }),
    )

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    expect(navigateMock).not.toHaveBeenCalled()
  })
})
