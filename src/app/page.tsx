'use client';

import { useState, useEffect, useCallback } from 'react';
import PersonForm from '@/components/PersonForm';
import PersonList from '@/components/PersonList';
import { Person } from '@/types';

export default function Home() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPersons = useCallback(async () => {
    try {
      const response = await fetch('/api/persons');
      const result = await response.json();
      if (result.success) {
        setPersons(result.data);
      }
    } catch (error) {
      console.error('Error fetching persons:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const handlePersonCreated = (person: Person) => {
    setPersons((prev) => [...prev, person]);
  };

  const handlePersonUpdated = (updatedPerson: Person) => {
    setPersons(prev => prev.map(p =>
      p.id === updatedPerson.id ? updatedPerson : p
    ));
  };

  const handleRemoveParent = async (childId: string, parentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/persons/${childId}/parents/${parentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setPersons(prev => prev.map(p =>
          p.id === childId
            ? { ...p, parentIds: p.parentIds.filter(id => id !== parentId) }
            : p
        ));
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to remove parent' };
      }
    } catch (error) {
      console.error('Error removing parent:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const handleDeletePerson = async (personId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/persons/${personId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setPersons(prev => {
          const filtered = prev.filter(p => p.id !== personId);
          return filtered.map(p => ({
            ...p,
            parentIds: p.parentIds.filter(id => id !== personId)
          }));
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to delete person' };
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Family Tree Builder</h1>
        <p>Create people and define parent-child relationships</p>
      </header>

      <div className="main-grid">
        <div className="card">
          <h2>Add Person</h2>
          <PersonForm onPersonCreated={handlePersonCreated} />
        </div>

        <div className="card">
          <h2>People ({persons.length})</h2>
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
              Loading...
            </p>
          ) : (
            <PersonList
              persons={persons}
              onRemoveParent={handleRemoveParent}
              onDeletePerson={handleDeletePerson}
              onPersonUpdated={handlePersonUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
