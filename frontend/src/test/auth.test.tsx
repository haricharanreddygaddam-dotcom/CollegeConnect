import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../api/client', () => ({
  default: apiMock,
}))

function AuthProbe() {
  const { user, token, loading, login, logout } = useAuth()

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'no-user'}</span>
      <span data-testid="token">{token ?? 'no-token'}</span>
      <button
        onClick={() =>
          login('admin@campusconnect.edu', 'AdminPassword@123')
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('CampusConnect authentication provider', () => {
  beforeEach(() => {
    localStorage.clear()
    apiMock.get.mockReset()
    apiMock.post.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs in explicitly, stores the token, and loads the authenticated profile', async () => {
    apiMock.get.mockResolvedValueOnce({ data: [] })

    apiMock.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
      },
    })

    apiMock.get.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Admin User',
        email: 'admin@campusconnect.edu',
        role: 'admin',
      },
    })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        'admin@campusconnect.edu',
      )
    })

    expect(screen.getByTestId('token')).toHaveTextContent(
      'test-access-token',
    )

    expect(localStorage.getItem('cc_token')).toBe('test-access-token')
  })

  it('restores an existing token through /auth/me', async () => {
    localStorage.setItem('cc_token', 'existing-token')

    apiMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: {
          id: 4,
          name: 'David Thorne',
          email: 'david.thorne@campusconnect.edu',
          role: 'faculty',
        },
      })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        'david.thorne@campusconnect.edu',
      )
    })

    expect(screen.getByTestId('token')).toHaveTextContent(
      'existing-token',
    )
  })

  it('logs out and removes the stored token', async () => {
    localStorage.setItem('cc_token', 'existing-token')

    apiMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Admin User',
          email: 'admin@campusconnect.edu',
          role: 'admin',
        },
      })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        'admin@campusconnect.edu',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(localStorage.getItem('cc_token')).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
  })
})

describe('CampusConnect authentication startup security', () => {
  beforeEach(() => {
    localStorage.clear()
    apiMock.get.mockReset()
    apiMock.post.mockReset()
  })

  it('does not automatically authenticate when no token exists', async () => {
    apiMock.get.mockResolvedValueOnce({ data: [] })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(apiMock.post).not.toHaveBeenCalled()
  })
})
