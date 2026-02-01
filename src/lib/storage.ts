import { promises as fs } from 'fs';
import path from 'path';
import { FamilyData, Person } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'family.json');

/**
 * Read family data from JSON file
 */
export async function readFamilyData(): Promise<FamilyData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data) as FamilyData;
  } catch (error) {
    // If file doesn't exist or is invalid, return empty data
    console.error('Error reading family data:', error);
    return { persons: [] };
  }
}

/**
 * Write family data to JSON file
 */
export async function writeFamilyData(data: FamilyData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get all persons
 */
export async function getPersons(): Promise<Person[]> {
  const data = await readFamilyData();
  return data.persons;
}

/**
 * Get a person by ID
 */
export async function getPersonById(id: string): Promise<Person | undefined> {
  const data = await readFamilyData();
  return data.persons.find(p => p.id === id);
}

/**
 * Add a new person
 */
export async function addPerson(person: Person): Promise<Person> {
  const data = await readFamilyData();
  data.persons.push(person);
  await writeFamilyData(data);
  return person;
}

/**
 * Update a person
 */
export async function updatePerson(id: string, updates: Partial<Person>): Promise<Person | null> {
  const data = await readFamilyData();
  const index = data.persons.findIndex(p => p.id === id);

  if (index === -1) {
    return null;
  }

  data.persons[index] = { ...data.persons[index], ...updates };
  await writeFamilyData(data);
  return data.persons[index];
}

/**
 * Delete a person
 */
export async function deletePerson(id: string): Promise<boolean> {
  const data = await readFamilyData();
  const initialLength = data.persons.length;

  // Remove the person
  data.persons = data.persons.filter(p => p.id !== id);

  // Also remove this person from any parentIds arrays
  data.persons = data.persons.map(p => ({
    ...p,
    parentIds: p.parentIds.filter(parentId => parentId !== id)
  }));

  if (data.persons.length === initialLength) {
    return false;
  }

  await writeFamilyData(data);
  return true;
}
