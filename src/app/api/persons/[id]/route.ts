import { NextRequest, NextResponse } from 'next/server';
import { getPersonById, deletePerson } from '@/lib/storage';
import { ApiResponse, Person } from '@/types';

interface RouteParams {
  request: NextRequest,
  params: Promise<{ id: string }>;
}

/**
 * GET /api/persons/[id] - Get a single person
 */
export async function GET(
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Person>>> {
  try {
    const { id } = await params;
    const person = await getPersonById(id);

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: person });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/persons/[id] - Delete a person
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const deleted = await deletePerson(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete person' },
      { status: 500 }
    );
  }
}
