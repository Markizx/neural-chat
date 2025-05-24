import React, { useState, useCallback } from 'react';
import { TextField, InputAdornment, IconButton, TextFieldProps } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';

export interface SearchInputProps extends Omit<TextFieldProps, 'onChange'> {
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onChange,
  debounceMs = 300,
  showClearButton = true,
  value: controlledValue,
  defaultValue = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue as string);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const debouncedValue = useDebounce(value as string, debounceMs);

  React.useEffect(() => {
    if (onSearch && debouncedValue !== undefined) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
    },
    [onChange, controlledValue]
  );

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  }, [onChange, onSearch, controlledValue]);

  return (
    <TextField
      {...props}
      value={value}
      onChange={handleChange}
      InputProps={{
        ...props.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: showClearButton && value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear}>
              <Clear />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default SearchInput;