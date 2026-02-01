'use client';

import { useState } from 'react';
import styles from '@/styles/PersonList.module.css';
import { ApiResponse, Person } from '@/types';
import { formatDate } from '@/lib/utils';
import { validateParentRelationship } from '@/lib/validation';
import FamilyTreeModal from './FamilyTreeModal';
import ConfirmModal from './ConfirmModal';

interface PersonListProps {
  persons: Person[];
  onRemoveParent: (childId: string, parentId: string) => Promise<ApiResponse>;
  onDeletePerson: (personId: string) => Promise<ApiResponse>;
  onPersonUpdated: (person: Person) => void;
}

interface ConfirmAction {
  type: 'delete' | 'removeParent';
  personId: string;
  personName: string;
  parentId?: string;
  parentName?: string;
  childName?: string;
}

export default function PersonList({ persons, onRemoveParent, onDeletePerson, onPersonUpdated }: PersonListProps) {
  const [addingParentFor, setAddingParentFor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorForPerson, setErrorForPerson] = useState<{ personId: string; message: string } | null>(null);
  const [viewingTreeFor, setViewingTreeFor] = useState<Person | null>(null);
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);
  const [removingParentKey, setRemovingParentKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const getPersonName = (id: string): string => {
    const person = persons.find(p => p.id === id);
    return person?.name || 'Unknown';
  };

  const getAvailableParents = (childId: string): Person[] => {
    const child = persons.find(p => p.id === childId);
    if (!child) return [];

    return persons.filter(potentialParent => {
      // Use the same validation logic as the server
      const errors = validateParentRelationship(potentialParent, child, persons);
      return errors.length === 0;
    });
  };

  const handleAddParent = async (childId: string, parentId: string) => {
    const child = persons.find(p => p.id === childId);
    const parent = persons.find(p => p.id === parentId);

    if (!child || !parent) {
      setErrorForPerson({ personId: childId, message: 'Person not found' });
      return;
    }

    // Client-side validation (same logic as server)
    const validationErrors = validateParentRelationship(parent, child, persons);
    if (validationErrors.length > 0) {
      setErrorForPerson({ personId: childId, message: validationErrors[0].message });
      return;
    }

    setIsSubmitting(true);
    setErrorForPerson(null);

    try {
      const response = await fetch(`/api/persons/${childId}/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });

      const result = await response.json();
      if (result.success) {
        onPersonUpdated(result.data);
        setAddingParentFor(null);
      } else {
        // Show server-side error to user
        const errorMessage = result.errors?.[0]?.message || result.error || 'Failed to add parent';
        setErrorForPerson({ personId: childId, message: errorMessage });
      }
    } catch (error) {
      console.error('Error adding parent:', error);
      setErrorForPerson({ personId: childId, message: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAddParent = () => {
    setAddingParentFor(null);
    setErrorForPerson(null);
  };

  const handleDeletePerson = (personId: string, personName: string) => {
    setConfirmAction({ type: 'delete', personId, personName });
  };

  const handleRemoveParent = (childId: string, parentId: string, childName: string, parentName: string) => {
    setConfirmAction({
      type: 'removeParent',
      personId: childId,
      personName: childName,
      parentId,
      parentName,
      childName
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setErrorForPerson(null);

    if (confirmAction.type === 'delete') {
      setDeletingPersonId(confirmAction.personId);
      try {
        const result = await onDeletePerson(confirmAction.personId);
        if (!result.success) {
          setErrorForPerson({ personId: confirmAction.personId, message: result.error || 'Failed to delete person' });
        }
      } finally {
        setDeletingPersonId(null);
        setConfirmAction(null);
      }
    } else if (confirmAction.type === 'removeParent' && confirmAction.parentId) {
      const key = `${confirmAction.personId}-${confirmAction.parentId}`;
      setRemovingParentKey(key);
      try {
        const result = await onRemoveParent(confirmAction.personId, confirmAction.parentId);
        if (!result.success) {
          setErrorForPerson({ personId: confirmAction.personId, message: result.error || 'Failed to remove parent' });
        }
      } finally {
        setRemovingParentKey(null);
        setConfirmAction(null);
      }
    }
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
  };

  if (persons.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No people added yet. Create your first person using the form.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {persons.map((person) => {
        const hasMaxParents = person.parentIds.length >= 2;
        const isAddingParent = addingParentFor === person.id;
        const availableParents = getAvailableParents(person.id);

        return (
          <div key={person.id} className={styles.personCard}>
            <div className={styles.personHeader}>
              <div>
                <div className={styles.personName}>{person.name}</div>
                <div className={styles.personDetails}>
                  <p>Born: {formatDate(person.dateOfBirth)}</p>
                  {person.placeOfBirth && <p>Place: {person.placeOfBirth}</p>}
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.treeButton}
                  onClick={() => setViewingTreeFor(person)}
                  title="View family tree"
                >
                  Tree
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeletePerson(person.id, person.name)}
                  disabled={deletingPersonId === person.id}
                  title="Delete person"
                >
                  {deletingPersonId === person.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <div className={styles.parents}>
              <div className={styles.parentsHeader}>
                <div className={styles.parentsLabel}>Parents</div>
                {!isAddingParent && (
                  <button
                    className={styles.addParentButton}
                    onClick={() => setAddingParentFor(person.id)}
                    disabled={hasMaxParents || availableParents.length === 0}
                    title={hasMaxParents ? 'Maximum 2 parents allowed' : availableParents.length === 0 ? 'No available parents' : 'Add parent'}
                  >
                    +
                  </button>
                )}
              </div>

              {isAddingParent && (
                <div className={styles.addParentDropdown}>
                  <div className={styles.addParentControls}>
                    <select
                      className={styles.parentSelect}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddParent(person.id, e.target.value);
                        }
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    >
                      <option value="">Select a parent...</option>
                      {availableParents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.cancelButton}
                      onClick={handleCancelAddParent}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {errorForPerson?.personId === person.id && (
                <div className={styles.parentError}>{errorForPerson.message}</div>
              )}

              {person.parentIds.length > 0 ? (
                <div className={styles.parentsList}>
                  {person.parentIds.map((parentId) => {
                    const parentName = getPersonName(parentId);
                    const isRemoving = removingParentKey === `${person.id}-${parentId}`;
                    return (
                      <span key={parentId} className={styles.parentTag}>
                        {parentName}
                        <button
                          className={styles.removeParentButton}
                          onClick={() => handleRemoveParent(person.id, parentId, person.name, parentName)}
                          disabled={isRemoving}
                          title="Remove parent"
                        >
                          {isRemoving ? '...' : '×'}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                !isAddingParent && <span className={styles.noParents}>No parents assigned</span>
              )}
            </div>
          </div>
        );
      })}

      {viewingTreeFor && (
        <FamilyTreeModal
          person={viewingTreeFor}
          persons={persons}
          onClose={() => setViewingTreeFor(null)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete Person' : 'Remove Parent'}
          message={
            confirmAction.type === 'delete'
              ? `Are you sure you want to delete "${confirmAction.personName}"? This will also remove them from any parent relationships.`
              : `Are you sure you want to remove "${confirmAction.parentName}" as a parent of "${confirmAction.childName}"?`
          }
          confirmText={confirmAction.type === 'delete' ? 'Delete' : 'Remove'}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirm}
        />
      )}
    </div>
  );
}
