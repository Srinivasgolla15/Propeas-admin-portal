import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={label.replace(/\s+/g, '-').toLowerCase()}
          className="mb-1 text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={label ? label.replace(/\s+/g, '-').toLowerCase() : undefined}
        aria-label={label ? undefined : "Select"}
        value={value}
        onChange={onChange}
        required={required}
        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
