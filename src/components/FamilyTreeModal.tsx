'use client';

import { Person } from '@/types';
import styles from '@/styles/FamilyTreeModal.module.css';

interface FamilyTreeModalProps {
  person: Person;
  persons: Person[];
  onClose: () => void;
}

export default function FamilyTreeModal({ person, persons, onClose }: FamilyTreeModalProps) {
  const getPersonById = (id: string): Person | undefined => {
    return persons.find(p => p.id === id);
  };

  const getChildren = (parentId: string): Person[] => {
    return persons.filter(p => p.parentIds.includes(parentId));
  };

  // Render ancestors recursively (going up)
  const renderAncestors = (personIds: string[]): React.ReactNode => {
    if (personIds.length === 0) return null;

    const ancestors = personIds.map(id => getPersonById(id)).filter(Boolean) as Person[];
    if (ancestors.length === 0) return null;

    // Get the next level of ancestors (grandparents)
    const nextLevelIds = ancestors.flatMap(a => a.parentIds);

    return (
      <div className={styles.ancestorLevel}>
        {nextLevelIds.length > 0 && renderAncestors(nextLevelIds)}
        <div className={styles.generation}>
          {ancestors.map(ancestor => (
            <div key={ancestor.id} className={styles.personNode}>
              <div className={styles.personName}>{ancestor.name}</div>
            </div>
          ))}
        </div>
        <div className={styles.connector}>│</div>
      </div>
    );
  };

  // Render descendants recursively (going down)
  const renderDescendants = (parentId: string): React.ReactNode => {
    const children = getChildren(parentId);
    if (children.length === 0) return null;

    return (
      <div className={styles.descendantLevel}>
        <div className={styles.connector}>│</div>
        <div className={styles.generation}>
          {children.map(child => (
            <div key={child.id} className={styles.descendantBranch}>
              <div className={styles.personNode}>
                <div className={styles.personName}>{child.name}</div>
              </div>
              {renderDescendants(child.id)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Family Tree</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.treeContainer}>
          {/* Ancestors (parents, grandparents, etc.) */}
          {person.parentIds.length > 0 && (
            <div className={styles.ancestors}>
              {renderAncestors(person.parentIds)}
            </div>
          )}

          {/* Focused person */}
          <div className={styles.focusedPerson}>
            <div className={styles.personNode + ' ' + styles.focused}>
              <div className={styles.personName}>{person.name}</div>
              <div className={styles.focusLabel}>Selected</div>
            </div>
          </div>

          {/* Descendants (children, grandchildren, etc.) */}
          {getChildren(person.id).length > 0 && (
            <div className={styles.descendants}>
              {renderDescendants(person.id)}
            </div>
          )}

          {/* Empty state */}
          {person.parentIds.length === 0 && getChildren(person.id).length === 0 && (
            <p className={styles.emptyState}>No family relationships defined for this person.</p>
          )}
        </div>
      </div>
    </div>
  );
}
