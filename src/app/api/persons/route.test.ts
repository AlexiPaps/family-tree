import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getPersons: vi.fn(),
  addPerson: vi.fn(),
}));

// Mock only generateId from utils, keep real implementations of other functions
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'test-id-123'),
  };
});

import { getPersons, addPerson } from '@/lib/storage';

const mockGetPersons = vi.mocked(getPersons);
const mockAddPerson = vi.mocked(addPerson);

describe('GET /api/persons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all persons successfully', async () => {
    const mockPersons = [
      { id: '1', name: 'John Doe', dateOfBirth: '1990-01-01', parentIds: [] },
      { id: '2', name: 'Jane Doe', dateOfBirth: '1992-05-15', parentIds: [] },
    ];
    mockGetPersons.mockResolvedValue(mockPersons);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockPersons);
  });

  it('returns empty array when no persons exist', async () => {
    mockGetPersons.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('returns 500 when storage fails', async () => {
    mockGetPersons.mockRejectedValue(new Error('Storage error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch persons');
  });
});

describe('POST /api/persons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a person with valid data', async () => {
    const inputData = {
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      placeOfBirth: 'NYC',
    };

    const expectedPerson = {
      id: 'test-id-123',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      placeOfBirth: 'NYC',
      parentIds: [],
    };

    mockAddPerson.mockResolvedValue(expectedPerson);

    const request = new NextRequest('http://localhost/api/persons', {
      method: 'POST',
      body: JSON.stringify(inputData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(expectedPerson);
    expect(mockAddPerson).toHaveBeenCalledWith(expectedPerson);
  });

  it('creates a person without optional placeOfBirth', async () => {
    const inputData = {
      name: 'Jane Doe',
      dateOfBirth: '1995-06-20',
    };

    const expectedPerson = {
      id: 'test-id-123',
      name: 'Jane Doe',
      dateOfBirth: '1995-06-20',
      placeOfBirth: undefined,
      parentIds: [],
    };

    mockAddPerson.mockResolvedValue(expectedPerson);

    const request = new NextRequest('http://localhost/api/persons', {
      method: 'POST',
      body: JSON.stringify(inputData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Jane Doe');
    expect(data.data.placeOfBirth).toBeUndefined();
  });

  it('returns 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost/api/persons', {
      method: 'POST',
      body: JSON.stringify({ dateOfBirth: '1990-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
    expect(data.errors.some((e: { field: string }) => e.field === 'name')).toBe(true);
  });

  it('returns 400 when dateOfBirth is in the future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const request = new NextRequest('http://localhost/api/persons', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        dateOfBirth: futureDate.toISOString().split('T')[0],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
