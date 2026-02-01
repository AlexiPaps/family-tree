import { NextRequest, NextResponse } from 'next/server';
import { getPersonById, getPersons, updatePerson } from '@/lib/storage';
import { validateParentRelationship } from '@/lib/validation';
import { ApiResponse, Person } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/persons/[id]/parents - Add a parent to a person
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Person>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { parentId } = body;

    if (!parentId) {
      return NextResponse.json(
        { success: false, error: 'parentId is required' },
        { status: 400 }
      );
    }

    // Get the child person
    const child = await getPersonById(id);
    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // Get the parent person
    const parent = await getPersonById(parentId);
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent person not found' },
        { status: 404 }
      );
    }

    // Get all persons for cycle detection
    const allPersons = await getPersons();

    // Validate the relationship
    const errors = validateParentRelationship(parent, child, allPersons);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Add parent to child's parentIds
    const updatedChild = await updatePerson(id, {
      parentIds: [...child.parentIds, parentId]
    });

    if (!updatedChild) {
      return NextResponse.json(
        { success: false, error: 'Failed to update person' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedChild });
  } catch (error) {
    console.error('Error adding parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add parent' },
      { status: 500 }
    );
  }
}
