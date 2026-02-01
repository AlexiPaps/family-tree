'use client';

import { useState, SubmitEvent } from 'react';
import styles from '@/styles/PersonForm.module.css';
import { Person, ValidationError } from '@/types';
import { validatePerson } from '@/lib/validation';

interface PersonFormProps {
  onPersonCreated: (person: Person) => void;
}

export default function PersonForm({ onPersonCreated }: PersonFormProps) {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setErrors([]);
    setFormError('');
    setSuccessMessage('');

    // Client-side validation (uses same logic as server)
    const validationErrors = validatePerson({
      name: name.trim(),
      dateOfBirth,
      placeOfBirth: placeOfBirth.trim() || undefined,
    });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dateOfBirth,
          placeOfBirth: placeOfBirth.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setFormError(result.error || 'Failed to create person');
        }
        return;
      }

      // Success - clear form and notify parent
      setName('');
      setDateOfBirth('');
      setPlaceOfBirth('');
      setSuccessMessage(`${result.data.name} has been added!`);
      onPersonCreated(result.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating person:', error);
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {formError && <div className={styles.formError}>{formError}</div>}
      {successMessage && <div className={styles.formSuccess}>{successMessage}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${styles.input} ${getFieldError('name') ? styles.inputError : ''}`}
          placeholder="Enter full name"
        />
        {getFieldError('name') && (
          <span className={styles.fieldError}>{getFieldError('name')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="dateOfBirth" className={styles.label}>
          Date of Birth <span className={styles.required}>*</span>
        </label>
        <input
          type="date"
          id="dateOfBirth"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={`${styles.input} ${getFieldError('dateOfBirth') ? styles.inputError : ''}`}
          max={new Date().toISOString().split('T')[0]}
        />
        {getFieldError('dateOfBirth') && (
          <span className={styles.fieldError}>{getFieldError('dateOfBirth')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="placeOfBirth" className={styles.label}>
          Place of Birth
        </label>
        <input
          type="text"
          id="placeOfBirth"
          value={placeOfBirth}
          onChange={(e) => setPlaceOfBirth(e.target.value)}
          className={styles.input}
          placeholder="Enter place of birth (optional)"
        />
        {getFieldError('placeOfBirth') && (
          <span className={styles.fieldError}>{getFieldError('placeOfBirth')}</span>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add Person'}
      </button>
    </form>
  );
}
