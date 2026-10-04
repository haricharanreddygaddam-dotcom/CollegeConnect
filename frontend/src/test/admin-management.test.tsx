import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AdminManagementPage } from '../pages/AdminManagement'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

const confirmMock = vi.hoisted(() => vi.fn())

vi.mock('../api/client', () => ({
  default: apiMock,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@campusconnect.edu',
      role: 'admin',
    },
  }),
}))

describe('CampusConnect admin management', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    apiMock.put.mockReset()
    apiMock.delete.mockReset()

    confirmMock.mockReset()
    confirmMock.mockReturnValue(true)

    vi.stubGlobal('confirm', confirmMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function mockInitialData() {
    apiMock.get.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Computer Science and Engineering',
              code: 'CSE',
              building: 'Block 1',
            },
          ],
        })
      }

      if (endpoint === '/faculty') {
        return Promise.resolve({
          data: [
            {
              id: 4,
              name: 'David Thorne',
              email: 'david.thorne@campusconnect.edu',
              employee_id: 'FAC001',
              department_name: 'CSE',
              is_active: true,
            },
          ],
        })
      }

      if (endpoint === '/students') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Haricharan Reddy',
              email: 'haricharan.reddy@campusconnect.edu',
              roll_number: 'CSE001',
              department_id: 1,
              year: 3,
              semester: 5,
              section: 'A',
              phone: null,
              address: null,
              parent_name: null,
              parent_phone: null,
              admission_year: 2023,
              cgpa: 8.5,
              department_name: 'CSE',
              is_active: true,
            },
          ],
        })
      }

      if (endpoint === '/subjects') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Data Structures',
              code: 'CS301',
              credits: 4,
              semester: 5,
            },
          ],
        })
      }

      return Promise.resolve({ data: [] })
    })
  }

  it('loads the student administration table for an admin', async () => {
    mockInitialData()

    render(<AdminManagementPage />)

    expect(screen.getByText('Administration & Management')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    expect(screen.getByText('CSE001 • CSE')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    expect(apiMock.get).toHaveBeenCalledWith('/students')
    expect(apiMock.get).toHaveBeenCalledWith('/departments')
    expect(apiMock.get).toHaveBeenCalledWith('/faculty')
  })

  it('switches between administration tabs and loads the correct endpoint', async () => {
    mockInitialData()

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Faculty' }))

    await waitFor(() => {
      expect(screen.getByText('David Thorne')).toBeInTheDocument()
    })

    expect(apiMock.get).toHaveBeenCalledWith('/faculty')

    fireEvent.click(screen.getByRole('button', { name: 'Departments' }))

    await waitFor(() => {
      expect(
        screen.getByText('Computer Science and Engineering'),
      ).toBeInTheDocument()
    })

    expect(apiMock.get).toHaveBeenCalledWith('/departments')

    fireEvent.click(screen.getByRole('button', { name: 'Subjects' }))

    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument()
    })

    expect(apiMock.get).toHaveBeenCalledWith('/subjects')
  })

  it('opens the create form for students', async () => {
    mockInitialData()

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Add student' }),
    )

    expect(screen.getByRole('heading', { name: 'Create student' })).toBeInTheDocument()
    expect(screen.getByText('Admin-only operation')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create Record' }),
    ).toBeInTheDocument()
  })

  it('creates a new student and reloads the table', async () => {
    mockInitialData()

    apiMock.post.mockResolvedValueOnce({
      data: {
        id: 12,
        name: 'New Student',
      },
    })

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Add student' }),
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Student' },
    })

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new.student@campusconnect.edu' },
    })

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Student@123' },
    })

    fireEvent.change(screen.getByLabelText('Roll Number'), {
      target: { value: 'CSE999' },
    })

    fireEvent.change(screen.getByLabelText('Department ID'), {
      target: { value: '1' },
    })

    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '3' },
    })

    fireEvent.change(screen.getByLabelText('Semester'), {
      target: { value: '5' },
    })

    fireEvent.change(screen.getByLabelText('Section'), {
      target: { value: 'A' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Create Record' }),
    )

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        '/students',
        expect.objectContaining({
          name: 'New Student',
          email: 'new.student@campusconnect.edu',
          roll_number: 'CSE999',
          department_id: 1,
          year: 3,
          semester: 5,
          section: 'A',
        }),
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText('Record created successfully.'),
      ).toBeInTheDocument()
    })

    expect(apiMock.get).toHaveBeenCalledWith('/students')
  })

  it('edits an existing student', async () => {
    mockInitialData()

    apiMock.put.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Updated Student',
      },
    })

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    const editButton = screen.getByTitle('Edit')

    fireEvent.click(editButton)

    expect(
      screen.getByRole('heading', { name: 'Edit student' }),
    ).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('Haricharan Reddy')

    fireEvent.change(nameInput, {
      target: { value: 'Updated Student' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Save Changes' }),
    )

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledWith(
        '/students/1',
        expect.objectContaining({
          name: 'Updated Student',
          roll_number: 'CSE001',
          department_id: 1,
          year: 3,
          semester: 5,
        }),
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText('Record updated successfully.'),
      ).toBeInTheDocument()
    })
  })

  it('deactivates an active student after confirmation', async () => {
    mockInitialData()

    apiMock.delete.mockResolvedValueOnce({ data: {} })

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Haricharan Reddy')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Deactivate'))

    expect(confirmMock).toHaveBeenCalledWith(
      'Deactivate Haricharan Reddy? They will no longer be able to sign in.',
    )

    await waitFor(() => {
      expect(apiMock.delete).toHaveBeenCalledWith('/students/1')
    })

    await waitFor(() => {
      expect(
        screen.getByText('Haricharan Reddy was deactivated.'),
      ).toBeInTheDocument()
    })
  })

  it('displays API errors instead of silently failing', async () => {
    apiMock.get.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments' || endpoint === '/faculty') {
        return Promise.resolve({ data: [] })
      }

      return Promise.reject({
        response: {
          data: {
            detail: 'Unable to load students',
          },
        },
      })
    })

    render(<AdminManagementPage />)

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load students'),
      ).toBeInTheDocument()
    })
  })
})
