import { REGEX_PATTERNS, FILE_UPLOAD_LIMITS } from './constants';

// Email validation
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!REGEX_PATTERNS.EMAIL.test(email)) return 'Invalid email format';
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!REGEX_PATTERNS.PASSWORD.test(password)) {
    return 'Password must contain uppercase, lowercase, number and special character';
  }
  return null;
};

// Name validation
export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 50) return 'Name must be less than 50 characters';
  return null;
};

// URL validation
export const validateUrl = (url: string): string | null => {
  if (!url) return 'URL is required';
  if (!REGEX_PATTERNS.URL.test(url)) return 'Invalid URL format';
  return null;
};

// File validation
export const validateFile = (file: File): string | null => {
  if (!file) return 'File is required';
  if (file.size > FILE_UPLOAD_LIMITS.MAX_SIZE) {
    return `File size must be less than ${FILE_UPLOAD_LIMITS.MAX_SIZE / (1024 * 1024)}MB`;
  }
  if (!FILE_UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
    return 'File type not allowed';
  }
  return null;
};

// Files validation (multiple)
export const validateFiles = (files: File[]): string | null => {
  if (!files || files.length === 0) return 'At least one file is required';
  if (files.length > FILE_UPLOAD_LIMITS.MAX_FILES) {
    return `Maximum ${FILE_UPLOAD_LIMITS.MAX_FILES} files allowed`;
  }
  
  for (const file of files) {
    const error = validateFile(file);
    if (error) return error;
  }
  
  return null;
};

// Project name validation
export const validateProjectName = (name: string): string | null => {
  if (!name) return 'Project name is required';
  if (name.length < 3) return 'Project name must be at least 3 characters';
  if (name.length > 50) return 'Project name must be less than 50 characters';
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, spaces, hyphens and underscores';
  }
  return null;
};

// Chat message validation
export const validateMessage = (message: string): string | null => {
  if (!message || !message.trim()) return 'Message cannot be empty';
  if (message.length > 10000) return 'Message is too long (max 10,000 characters)';
  return null;
};

// Brainstorm topic validation
export const validateBrainstormTopic = (topic: string): string | null => {
  if (!topic || !topic.trim()) return 'Topic is required';
  if (topic.length < 3) return 'Topic must be at least 3 characters';
  if (topic.length > 200) return 'Topic must be less than 200 characters';
  return null;
};

// Form validation helper
export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => string | null;
}

export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): Record<keyof T, string | null> => {
  const errors: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;
  
  for (const rule of rules) {
    const value = data[rule.field];
    const error = rule.validator(value);
    if (error) {
      errors[rule.field] = error;
    }
  }
  
  return errors;
};

// Check if form has errors
export const hasFormErrors = (errors: Record<string, string | null>): boolean => {
  return Object.values(errors).some(error => error !== null);
};

// Custom validation hook
import { useState, useCallback } from 'react';

export const useValidation = <T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRule<T>[]
) => {
  const [errors, setErrors] = useState<Record<keyof T, string | null>>(
    {} as Record<keyof T, string | null>
  );

  const validate = useCallback(
    (data: T): boolean => {
      const newErrors = validateForm(data, rules);
      setErrors(newErrors);
      return !hasFormErrors(newErrors);
    },
    [rules]
  );

  const validateField = useCallback(
    (field: keyof T, value: any): string | null => {
      const rule = rules.find(r => r.field === field);
      if (!rule) return null;
      
      const error = rule.validator(value);
      setErrors(prev => ({ ...prev, [field]: error }));
      return error;
    },
    [rules]
  );

  const clearErrors = useCallback(() => {
    setErrors({} as Record<keyof T, string | null>);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    hasErrors: hasFormErrors(errors),
  };
};

// Password strength checker
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  
  if (/[a-z]/.test(password)) score += 0.5;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 0.5;
  else feedback.push('Add uppercase letters');
  
  if (/\d/.test(password)) score += 0.5;
  else feedback.push('Add numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
  else feedback.push('Add special characters');

  // Bonus for mixing different types
  const types = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  
  if (types >= 3) score += 0.5;
  if (types === 4) score += 0.5;

  return {
    score: Math.min(Math.floor(score), 4),
    feedback,
    isStrong: score >= 3,
  };
};