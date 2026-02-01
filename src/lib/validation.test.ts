import { describe, it, expect } from 'vitest';
import { validatePerson, validateParentRelationship, getAncestors } from './validation';
import { Person } from '@/types';

// Helper to create a person for testing
function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'test-id',
    name: 'Test Person',
    dateOfBirth: '1990-01-01',
    parentIds: [],
    ...overrides,
  };
}

describe('validatePerson', () => {
  it('returns no errors for valid person data', () => {
    const errors = validatePerson({
      name: 'John Doe',
      dateOfBirth: '1990-05-15',
      placeOfBirth: 'NYC',
    });
    expect(errors).toHaveLength(0);
  });

  it('returns error when name is missing', () => {
    const errors = validatePerson({
      dateOfBirth: '1990-05-15',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('name');
    expect(errors[0].message).toBe('Name is required');
  });

  it('returns error when name is empty string', () => {
    const errors = validatePerson({
      name: '   ',
      dateOfBirth: '1990-05-15',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('name');
  });

  it('returns error when dateOfBirth is missing', () => {
    const errors = validatePerson({
      name: 'John Doe',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('dateOfBirth');
    expect(errors[0].message).toBe('Date of birth is required');
  });

  it('returns error when dateOfBirth is invalid', () => {
    const errors = validatePerson({
      name: 'John Doe',
      dateOfBirth: 'not-a-date',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('dateOfBirth');
    expect(errors[0].message).toBe('Invalid date format');
  });

  it('returns error when dateOfBirth is in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const errors = validatePerson({
      name: 'John Doe',
      dateOfBirth: futureDate.toISOString().split('T')[0],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('dateOfBirth');
    expect(errors[0].message).toBe('Date of birth cannot be in the future');
  });

  it('returns multiple errors when multiple fields are invalid', () => {
    const errors = validatePerson({});
    expect(errors).toHaveLength(2);
    expect(errors.map(e => e.field)).toContain('name');
    expect(errors.map(e => e.field)).toContain('dateOfBirth');
  });

  it('accepts optional placeOfBirth', () => {
    const errors = validatePerson({
      name: 'John Doe',
      dateOfBirth: '1990-05-15',
      // placeOfBirth omitted
    });
    expect(errors).toHaveLength(0);
  });
});

describe('validateParentRelationship', () => {
  it('returns no errors for valid parent-child relationship', () => {
    const parent = createPerson({ id: 'parent', dateOfBirth: '1970-01-01' });
    const child = createPerson({ id: 'child', dateOfBirth: '1990-01-01' });

    const errors = validateParentRelationship(parent, child, [parent, child]);
    expect(errors).toHaveLength(0);
  });

  it('returns error when person tries to be their own parent', () => {
    const person = createPerson({ id: 'same-id' });

    const errors = validateParentRelationship(person, person, [person]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('A person cannot be their own parent');
  });

  it('returns error when child already has 2 parents', () => {
    const parent1 = createPerson({ id: 'parent1', dateOfBirth: '1970-01-01' });
    const parent2 = createPerson({ id: 'parent2', dateOfBirth: '1970-01-01' });
    const newParent = createPerson({ id: 'parent3', dateOfBirth: '1970-01-01' });
    const child = createPerson({
      id: 'child',
      dateOfBirth: '1990-01-01',
      parentIds: ['parent1', 'parent2']
    });

    const errors = validateParentRelationship(newParent, child, [parent1, parent2, newParent, child]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('A person can have at most 2 parents');
  });

  it('returns error when parent is already assigned', () => {
    const parent = createPerson({ id: 'parent', dateOfBirth: '1970-01-01' });
    const child = createPerson({
      id: 'child',
      dateOfBirth: '1990-01-01',
      parentIds: ['parent']
    });

    const errors = validateParentRelationship(parent, child, [parent, child]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('This person is already a parent');
  });

  it('returns error when parent is not at least 15 years older', () => {
    const parent = createPerson({ id: 'parent', dateOfBirth: '1985-01-01' });
    const child = createPerson({ id: 'child', dateOfBirth: '1990-01-01' });

    const errors = validateParentRelationship(parent, child, [parent, child]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Parent must be at least 15 years older');
  });

  it('accepts parent exactly 15 years older', () => {
    const parent = createPerson({ id: 'parent', dateOfBirth: '1975-01-01' });
    const child = createPerson({ id: 'child', dateOfBirth: '1990-01-01' });

    const errors = validateParentRelationship(parent, child, [parent, child]);
    expect(errors).toHaveLength(0);
  });

  it('allows valid multi-generation relationships', () => {
    const grandparent = createPerson({
      id: 'grandparent',
      dateOfBirth: '1950-01-01',
      parentIds: []
    });
    const parent = createPerson({
      id: 'parent',
      dateOfBirth: '1970-01-01',
      parentIds: ['grandparent']
    });
    const child = createPerson({
      id: 'child',
      dateOfBirth: '1990-01-01',
      parentIds: []
    });

    // Adding parent as child's parent is valid
    const allPersons = [grandparent, parent, child];
    const errors = validateParentRelationship(parent, child, allPersons);

    expect(errors).toHaveLength(0);
  });
});

describe('getAncestors', () => {
  it('returns empty array for person with no parents', () => {
    const person = createPerson({ id: 'alone', parentIds: [] });

    const ancestors = getAncestors('alone', [person]);
    expect(ancestors).toHaveLength(0);
  });

  it('returns direct parents as ancestors', () => {
    const parent1 = createPerson({ id: 'parent1', parentIds: [] });
    const parent2 = createPerson({ id: 'parent2', parentIds: [] });
    const child = createPerson({ id: 'child', parentIds: ['parent1', 'parent2'] });

    const ancestors = getAncestors('child', [parent1, parent2, child]);
    expect(ancestors).toHaveLength(2);
    expect(ancestors.map(a => a.id)).toContain('parent1');
    expect(ancestors.map(a => a.id)).toContain('parent2');
  });

  it('returns grandparents as ancestors', () => {
    const grandparent = createPerson({ id: 'grandparent', parentIds: [] });
    const parent = createPerson({ id: 'parent', parentIds: ['grandparent'] });
    const child = createPerson({ id: 'child', parentIds: ['parent'] });

    const ancestors = getAncestors('child', [grandparent, parent, child]);
    expect(ancestors).toHaveLength(2);
    expect(ancestors.map(a => a.id)).toContain('parent');
    expect(ancestors.map(a => a.id)).toContain('grandparent');
  });

  it('returns empty array for non-existent person', () => {
    const person = createPerson({ id: 'exists' });

    const ancestors = getAncestors('does-not-exist', [person]);
    expect(ancestors).toHaveLength(0);
  });
});
