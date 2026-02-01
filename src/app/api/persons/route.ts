import { NextRequest, NextResponse } from 'next/server';
import { getPersons, addPerson } from '@/lib/storage';
import { validatePerson } from '@/lib/validation';
import { generateId } from '@/lib/utils';
import { ApiResponse, Person } from '@/types';

/**
 * GET /api/persons - Get all persons
 */
export async function GET(): Promise<NextResponse<ApiResponse<Person[]>>> {
  try {
    const persons = await getPersons();
    return NextResponse.json({ success: true, data: persons });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch persons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/persons - Create a new person
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Person>>> {
  try {
    const body = await request.json();

    // Validate input
    const errors = validatePerson(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Create person object
    const person: Person = {
      id: generateId(),
      name: body.name.trim(),
      dateOfBirth: body.dateOfBirth,
      placeOfBirth: body.placeOfBirth?.trim() || undefined,
      parentIds: [],
    };

    // Save to storage
    const savedPerson = await addPerson(person);

    return NextResponse.json(
      { success: true, data: savedPerson },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create person' },
      { status: 500 }
    );
  }
}
