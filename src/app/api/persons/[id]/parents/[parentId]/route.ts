import { NextRequest, NextResponse } from 'next/server';
import { getPersonById, updatePerson } from '@/lib/storage';
import { ApiResponse, Person } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; parentId: string }>;
}

/**
 * DELETE /api/persons/[id]/parents/[parentId] - Remove a parent from a person
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Person>>> {
  try {
    const { id, parentId } = await params;

    // Get the child person
    const child = await getPersonById(id);
    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    // Check if parentId is in the parentIds array
    if (!child.parentIds.includes(parentId)) {
      return NextResponse.json(
        { success: false, error: 'Parent relationship not found' },
        { status: 404 }
      );
    }

    // Remove parent from child's parentIds
    const updatedChild = await updatePerson(id, {
      parentIds: child.parentIds.filter(p => p !== parentId)
    });

    if (!updatedChild) {
      return NextResponse.json(
        { success: false, error: 'Failed to update person' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedChild });
  } catch (error) {
    console.error('Error removing parent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove parent' },
      { status: 500 }
    );
  }
}
