import { Person, ValidationError } from '@/types';
import { isValidDate, isDateInFuture, getAgeDifferenceInYears } from './utils';

const MIN_PARENT_AGE_DIFFERENCE = 15;
const MAX_PARENTS = 2;
const MAX_CHAR_POB = 100;

export interface PersonInput {
  name?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
}

/**
 * Validate person data for creation
 */
export function validatePerson(data: PersonInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  // Date of birth validation
  if (!data.dateOfBirth) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
  } else if (!isValidDate(data.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'Invalid date format' });
  } else if (isDateInFuture(data.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
  }

  // Place of birth is optional, but we make simple validation if it is provided
  if (data.placeOfBirth && (!/^[a-zA-Z0-9\s]+$/.test(data.placeOfBirth))) {
    errors.push({ field: 'placeOfBirth', message: 'Place of birth must only contain letters, numbers and spaces' });
  } else if (data.placeOfBirth && data.placeOfBirth.length > MAX_CHAR_POB) {
    errors.push({ field: 'placeOfBirth', message: `Place of birth must be less than ${MAX_CHAR_POB} characters` });
  }

  return errors;
}

/**
 * Validate adding a parent relationship
 */
export function validateParentRelationship(
  parent: Person,
  child: Person,
  allPersons: Person[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if person is trying to be their own parent
  if (parent.id === child.id) {
    errors.push({ field: 'parentId', message: 'A person cannot be their own parent' });
    return errors;
  }

  // Check max parents
  if (child.parentIds.length >= MAX_PARENTS) {
    errors.push({
      field: 'parentId',
      message: `A person can have at most ${MAX_PARENTS} parents`
    });
    return errors;
  }

  // Check if already a parent
  if (child.parentIds.includes(parent.id)) {
    errors.push({ field: 'parentId', message: 'This person is already a parent' });
    return errors;
  }

  // Check age difference (parent must be at least 15 years older)
  const ageDiff = getAgeDifferenceInYears(parent.dateOfBirth, child.dateOfBirth);
  if (ageDiff < MIN_PARENT_AGE_DIFFERENCE) {
    errors.push({
      field: 'parentId',
      message: `Parent must be at least ${MIN_PARENT_AGE_DIFFERENCE} years older than child (current difference: ${ageDiff} years)`
    });
  }

  // Check for cycles (parent cannot be a descendant of child) - (agediff prohibits this, but we keep the check anyway)
  if (isDescendant(parent.id, child.id, allPersons)) {
    errors.push({
      field: 'parentId',
      message: 'Cannot create cyclical relationship: this person is a descendant of the child'
    });
  }

  return errors;
}

/**
 * Check if personA is a descendant of personB
 * Uses BFS to traverse the family tree downward from personB
 */
function isDescendant(personAId: string, personBId: string, allPersons: Person[]): boolean {
  const visited = new Set<string>();
  const queue: string[] = [personBId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // Find all children of current person
    const children = allPersons.filter(p => p.parentIds.includes(currentId));

    for (const child of children) {
      if (child.id === personAId) {
        return true; // Found personA as a descendant
      }
      queue.push(child.id);
    }
  }

  return false;
}

/**
 * Get all ancestors of a person
 */
export function getAncestors(personId: string, allPersons: Person[]): Person[] {
  const ancestors: Person[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find the person and get their parents
  const person = allPersons.find(p => p.id === personId);
  if (!person) return ancestors;

  queue.push(...person.parentIds);

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const ancestor = allPersons.find(p => p.id === currentId);
    if (ancestor) {
      ancestors.push(ancestor);
      queue.push(...ancestor.parentIds);
    }
  }

  return ancestors;
}
