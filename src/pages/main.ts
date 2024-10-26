import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Type definitions
type FieldType = 'text' | 'number' | 'email' | 'select' | 'file' | 'radio' | 'checkbox' | 'date';
type OperatorType = 'equals' | 'not_null';
type ConditionType = 'required_if' | 'visible_if';

interface Condition {
    field: string;
    value: string;
    operator: OperatorType;
}

interface Field {
    name: string;
    type: FieldType;
    label: string;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    visible: boolean;
    options: string[];
    required_if: Condition[];
    visible_if: Condition[];
    accept?: string;
    maxSize?: number;
}

interface Group {
    name: string;
    description: string;
    fields: Field[];
}

interface FormDefinition {
    groups: Group[];
    settings: {
        showSubmitButton: boolean;
        submitButtonText: string;
    };
}

interface FormValues {
    [key: string]: string | boolean | File | null;
}

interface FormErrors {
    [key: string]: string[];
}

// Props interfaces
interface FieldInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: React.ReactNode;
    className?: string;
}

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

interface FieldBuilderProps {
    group: Group;
    groupIndex: number;
    field: Field;
    fieldIndex: number;
    onUpdateField: (groupIndex: number, fieldIndex: number, field: Field) => void;
    onRemoveField: (groupIndex: number, fieldIndex: number) => void;
    onAddCondition: (groupIndex: number, fieldIndex: number, type: ConditionType) => void;
    onRemoveCondition: (groupIndex: number, fieldIndex: number, type: ConditionType, conditionIndex: number) => void;
    onDragField: (sourceIndex: number, targetIndex: number) => void;
    availableFields?: string[];
}

interface FormPreviewProps {
    groups: Group[];
    formValues: FormValues;
    onInputChange: (name: string, value: string | boolean | File) => void;
}

interface JsonPreviewProps {
    onImport: (importedGroups: Group[]) => void;
}

// Available fields configuration
const AVAILABLE_FIELDS: string[] = [
    // Personal Information
    'first_name',
    'last_name',
    'email',
    'phone',
    'corporate_name',
    // Work Information
    'official_email',
    'company_name',
    'company_address',
    'position',
    'annual_salary',
    'supervisor_name',
    'supervisor_phone',
    'supervisor_email',
    // Next of Kin
    'next_kin_name',
    'next_kin_email',
    'next_kin_phone',
    // Personal details
    'dob',
    'current_home_address',
    'gender',
    'marital_status',
    'additional_phone',
    // Guarantor
    'guarantor_name',
    'guarantor_phone',
    'guarantor_email',
];

// Memoized Components
const MemoizedFieldInput = memo<FieldInputProps>(({ value, onChange, placeholder, className = "border rounded p-2" }) => (
    <input
    type= "text"
    placeholder = { placeholder }
    value = { value || ''}
onChange = {(e) => onChange(e.target.value)}
className = { className }
    />
));

const MemoizedSelect = memo<SelectProps>(({ value, onChange, options, className = "border rounded p-2" }) => (
    <select
    value= { value }
    onChange = {(e) => onChange(e.target.value)}
className = { className }
    >
    { options }
    </select>
));

const MemoizedCheckbox = memo<CheckboxProps>(({ checked, onChange, label }) => (
    <label className= "flex items-center" >
    <input
      type="checkbox"
      checked = { checked }
      onChange = {(e) => onChange(e.target.checked)}
className = "mr-2"
    />
    { label }
    </label>
));

// Utility functions
const generateFieldName = (label: string): string => {
    return label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
};

const validateField = (field: Field, formValues: FormValues): string[] => {
    const errors: string[] = [];
    const value = formValues[field.name];

    if (field.required && (value === undefined || value === '' || value === null)) {
        errors.push('This field is required');
    }

    if (value) {
        switch (field.type) {
            case 'email':
                if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push('Invalid email format');
                }
                break;
            case 'number':
                if (typeof value === 'string' && isNaN(Number(value))) {
                    errors.push('Must be a valid number');
                }
                break;
            case 'file':
                if (value instanceof File) {
                    if (field.maxSize && value.size > field.maxSize) {
                        errors.push(`File size must be less than ${field.maxSize / 1024 / 1024}MB`);
                    }
                    if (field.accept && !field.accept.split(',').some(type =>
                        value.type.match(new RegExp(type.replace('*', '.*')))
                    )) {
                        errors.push('Invalid file type');
                    }
                }
                break;
        }
    }

    return errors;
};

// Field Builder Component
const FieldBuilder = memo<FieldBuilderProps>(({
    group,
    groupIndex,
    field,
    fieldIndex,
    onUpdateField,
    onRemoveField,
    onAddCondition,
    onRemoveCondition,
    onDragField,
    availableFields = AVAILABLE_FIELDS
}) => {
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const formatFieldName = useCallback((fieldName: string): string => {
        return fieldName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, []);

    const getSuggestions = useCallback((input: string): string[] => {
        const inputValue = input.toLowerCase();
        return availableFields.filter(field =>
            formatFieldName(field).toLowerCase().includes(inputValue) ||
            field.includes(inputValue)
        );
    }, [availableFields, formatFieldName]);

    const handleFieldChange = useCallback((key: keyof Field, value: string | boolean | string[]) => {
        if (key === 'label') {
            const filteredSuggestions = getSuggestions(value as string);
            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);

            onUpdateField(groupIndex, fieldIndex, {
                ...field,
                label: value as string,
                name: generateFieldName(value as string)
            });
        } else {
            onUpdateField(groupIndex, fieldIndex, { ...field, [key]: value });
        }
    }, [groupIndex, fieldIndex, onUpdateField, field, getSuggestions]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
        const formattedLabel = formatFieldName(suggestion);
        onUpdateField(groupIndex, fieldIndex, {
            ...field,
            label: formattedLabel,
            name: suggestion
        });
        setShowSuggestions(false);
    }, [field, groupIndex, fieldIndex, onUpdateField, formatFieldName]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            groupIndex,
            fieldIndex,
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));

        if (data.groupIndex === groupIndex && data.fieldIndex !== fieldIndex) {
            onDragField(data.fieldIndex, fieldIndex);
        }
    };

    const handleConditionChange = useCallback((
        type: ConditionType,
        conditionIndex: number,
        key: keyof Condition,
        value: string
    ) => {
        const newField = { ...field };
        newField[type][conditionIndex] = {
            ...newField[type][conditionIndex],
            [key]: value
        };
        onUpdateField(groupIndex, fieldIndex, newField);
    }, [field, groupIndex, fieldIndex, onUpdateField]);

    const renderConditions = useCallback((type: ConditionType, title: string) => (
        <div>
        <h4 className= "font-medium mb-2" > { title } </h4>
        {
            field[type].map((condition, conditionIndex) => (
                <div key= {`${type}-${conditionIndex}`} className = "flex gap-2 mb-2" >
                <MemoizedFieldInput
              value={ condition.field }
              onChange = {(value) => handleConditionChange(type, conditionIndex, 'field', value)}
placeholder = "Field name"
className = "border rounded p-2 flex-1"
    />
    <MemoizedSelect
              value={ condition.operator }
onChange = {(value) => handleConditionChange(type, conditionIndex, 'operator', value as OperatorType)}
options = {<>
    <option value="equals" > Equals </option>
        < option value = "not_null" > Not Null </option>
            </>}
className = "border rounded p-2"
    />
    <MemoizedFieldInput
              value={ condition.value }
onChange = {(value) => handleConditionChange(type, conditionIndex, 'value', value)}
placeholder = "Value"
className = "border rounded p-2 flex-1"
    />
    <button
              onClick={ () => onRemoveCondition(groupIndex, fieldIndex, type, conditionIndex) }
className = "p-2 text-red-500 hover:text-red-700"
    >
    <Trash2 size={ 20 } />
        </button>
        </div>
        ))}
<button
          onClick={ () => onAddCondition(groupIndex, fieldIndex, type) }
className = "flex items-center text-blue-500 hover:text-blue-700"
    >
    <Plus size={ 20 } className = "mr-1" /> Add Condition
        </button>
        </div>
    ), [field, groupIndex, fieldIndex, handleConditionChange, onAddCondition, onRemoveCondition]);

return (
    <div 
        className= {`border p-4 rounded-lg mb-4 transition-colors ${isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
        }`}
draggable
onDragStart = { handleDragStart }
onDragOver = { handleDragOver }
onDragLeave = { handleDragLeave }
onDrop = { handleDrop }
    >
    <div className="flex justify-between items-center mb-4" >
        <div className="flex items-center gap-2" >
            <GripVertical className="text-gray-400" size = { 20} />
                <h3 className="font-medium" > { field.label || 'New Field' } </h3>
                    </div>
                    </div>

                    < div className = "grid grid-cols-2 gap-4 mb-4" >
                        <div className="relative" ref = { suggestionsRef } >
                            <input
              type="text"
placeholder = "Label"
value = { field.label || '' }
onChange = {(e) => handleFieldChange('label', e.target.value)}
className = "w-full border rounded p-2"
    />
    { showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-48 overflow-auto" >
        {
            suggestions.map((suggestion, index) => (
                <li
                    key= { index }
                    className = "px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    onClick = {() => handleSuggestionClick(suggestion)}
            >
            <span className="font-medium" > { formatFieldName(suggestion) } </span>
                < span className = "text-sm text-gray-500" > { suggestion } </span>
                    </li>
                ))}
</ul>
            )}
</div>
    </div>

    < div className = "grid grid-cols-2 gap-4 mb-4" >
        <MemoizedSelect
            value={ field.type }
onChange = {(value) => handleFieldChange('type', value)}
options = {<>
    <option value="text" > Text </option>
        < option value = "number" > Number </option>
            < option value = "email" > Email </option>
                < option value = "select" > Select </option>
                    < option value = "file" > File Upload </option>
                        < option value = "radio" > Radio </option>
                            < option value = "checkbox" > Checkbox </option>
                                < option value = "date" > Calendar </option>
                                    </>}
          />
    </div>

{
    (field.type === 'select' || field.type === 'radio') && (
        <div className="mb-4" >
            <MemoizedFieldInput
              value={ field.options.join(',') }
    onChange = {(value) => handleFieldChange('options', value.split(',').map(opt => opt.trim()))
}
placeholder = "Options (comma-separated)"
className = "border rounded p-2 w-full"
    />
    </div>
        )}

<div className="grid grid-cols-2 gap-4 mb-4" >
    <MemoizedCheckbox
            checked={ field.required }
onChange = {(checked) => handleFieldChange('required', checked)}
label = "Required"
    />
    <MemoizedCheckbox
            checked={ field.disabled }
onChange = {(checked) => handleFieldChange('disabled', checked)}
label = "Disabled"
    />
    <MemoizedCheckbox
            checked={ field.readonly }
onChange = {(checked) => handleFieldChange('readonly', checked)}
label = "Readonly"
    />
    <MemoizedCheckbox
            checked={ field.visible }
onChange = {(checked) => handleFieldChange('visible', checked)}
label = "Visible"
    />
    </div>

    < div className = "space-y-4" >
        { renderConditions('required_if', 'Required If Conditions') }
{ renderConditions('visible_if', 'Visible If Conditions') }
</div>

    < div className = "mt-4 flex justify-end" >
        <button
            onClick={ () => onRemoveField(groupIndex, fieldIndex) }
className = "text-red-500 hover:text-red-700 flex items-center"
    >
    <Trash2 size={ 20 } className = "mr-1" /> Remove Field
        </button>
        </div>
        </div>
    );
  });

// Form Preview Component
const FormPreview = memo<FormPreviewProps>(({ groups, formValues, onInputChange }) => {
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [errors, setErrors] = useState<FormErrors>({});

    const checkConditions = useCallback((conditions: Condition[], type: 'visible' | 'required'): boolean => {
        if (!conditions.length) return type === 'visible';
        return conditions.every(condition => {
            const fieldValue = formValues[condition.field];
            switch (condition.operator) {
                case 'equals':
                    return fieldValue === condition.value;
                case 'not_null':
                    return fieldValue != null && fieldValue !== '';
                default:
                    return true;
            }
        });
    }, [formValues]);

    const validateField = useCallback((field: Field): string[] => {
        const errors: string[] = [];
        const value = formValues[field.name];

        const isVisible = checkConditions(field.visible_if, 'visible');
        if (!isVisible) return errors;

        const isRequired = field.required || checkConditions(field.required_if, 'required');
        if (isRequired && (value === undefined || value === '' || value === null)) {
            errors.push('This field is required');
        }

        if (value) {
            switch (field.type) {
                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
                        errors.push('Invalid email format');
                    }
                    break;
                case 'number':
                    if (isNaN(Number(value))) {
                        errors.push('Must be a valid number');
                    }
                    break;
                case 'file':
                    if (value instanceof File) {
                        if (field.maxSize && value.size > field.maxSize) {
                            errors.push(`File size must be less than ${field.maxSize / 1024 / 1024}MB`);
                        }
                        if (field.accept && !field.accept.split(',').some(type =>
                            value.type.match(new RegExp(type.replace('*', '.*')))
                        )) {
                            errors.push('Invalid file type');
                        }
                    }
                    break;
            }
        }

        return errors;
    }, [formValues, checkConditions]);

    const validateCurrentPage = useCallback(() => {
        const currentGroup = groups[currentPage];
        const newErrors: FormErrors = {};
        let hasErrors = false;

        currentGroup.fields.forEach(field => {
            const fieldErrors = validateField(field);
            if (fieldErrors.length > 0) {
                newErrors[field.name] = fieldErrors;
                hasErrors = true;
            }
        });

        setErrors(newErrors);
        return !hasErrors;
    }, [currentPage, groups, validateField]);

    const handleNext = () => {
        if (validateCurrentPage() && currentPage < groups.length - 1) {
            setCurrentPage(curr => curr + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(curr => curr - 1);
        }
    };

    const handleSubmit = () => {
        if (validateCurrentPage()) {
            console.log(formValues);
            // Add your submit logic here
        }
    };

    // Current group content
    const currentGroup = groups[currentPage];

    return (
        <div className= "space-y-6" >
        {/* Progress indicator */ }
        < div className = "flex items-center justify-between mb-4" >
            <div className="text-sm text-gray-600" >
                Page { currentPage + 1 } of { groups.length }
    </div>
        < div className = "flex gap-2" >
            {
                Array.from({ length: groups.length }).map((_, index) => (
                    <div
                key= { index }
                className = {`h-2 w-8 rounded ${index === currentPage
                            ? 'bg-blue-500'
                            : index < currentPage
                                ? 'bg-blue-200'
                                : 'bg-gray-200'
                        }`}
            />
            ))}
</div>
    </div>

{/* Current group content */ }
<div className="border p-4 rounded-lg" >
    <h3 className="text-lg font-semibold mb-2" > { currentGroup.name } </h3>
{
    currentGroup.description && (
        <p className="text-gray-600 text-sm mb-4" > { currentGroup.description } </p>
          )
}
<div className="space-y-4" >
{
    currentGroup.fields.map((field, fieldIndex) => {
        const isVisible = checkConditions(field.visible_if, 'visible');
        const isRequired = field.required || checkConditions(field.required_if, 'required');
        const fieldId = `${currentGroup.name}-${field.name}-${fieldIndex}`;
        const fieldErrors = errors[field.name];

        if (!isVisible) return null;

        return (
            <div key= { fieldId } className = "space-y-2" >
                <label htmlFor={ fieldId } className = "block text-sm font-medium" >
                    { field.label }
        { isRequired && <span className="text-red-500" >* </span> }
        </label>
        {
            field.type === 'select' ? (
                <select
                      id= { fieldId }
                      name = { field.name }
            value = { formValues[field.name] as string ?? ''
        }
        onChange = {(e) => {
            onInputChange(field.name, e.target.value);
            if (errors[field.name]) {
                setErrors(prev => ({ ...prev, [field.name]: undefined }));
            }
        }
    }
                      className = {`w-full border rounded p-2 ${fieldErrors ? 'border-red-500' : ''}`}
required = { isRequired }
disabled = { field.disabled }
    >
    <option value="" > Select an option </option>
{
    field.options.map((option, i) => (
        <option key= {`${fieldId}-option-${i}`} value = { option } > { option } </option>
                      ))}
</select>
                  ) : field.type === 'radio' ? (
    <div className= "space-y-2" >
    {
        field.options.map((option, i) => (
            <label key= {`${fieldId}-option-${i}`} className = "flex items-center space-x-2" >
                <input
                            type="radio"
name = { field.name }
value = { option }
checked = { formValues[field.name] === option }
onChange = {(e) => {
    onInputChange(field.name, e.target.value);
    if (errors[field.name]) {
        setErrors(prev => ({ ...prev, [field.name]: undefined }));
    }
}}
required = { isRequired }
disabled = { field.disabled }
    />
    <span>{ option } </span>
    </label>
                      ))}
</div>
                  ) : field.type === 'checkbox' ? (
    <input
                      id= { fieldId }
                      type = "checkbox"
name = { field.name }
checked = {!!formValues[field.name]}
onChange = {(e) => {
    onInputChange(field.name, e.target.checked);
    if (errors[field.name]) {
        setErrors(prev => ({ ...prev, [field.name]: undefined }));
    }
}}
className = {`rounded border-gray-300 ${fieldErrors ? 'border-red-500' : ''}`}
required = { isRequired }
disabled = { field.disabled }
    />
                  ) : field.type === 'file' ? (
    <input
                      id= { fieldId }
                      type = "file"
name = { field.name }
onChange = {(e) => {
    const file = e.target.files?.[0];
    if (file) {
        onInputChange(field.name, file);
        if (errors[field.name]) {
            setErrors(prev => ({ ...prev, [field.name]: undefined }));
        }
    }
}}
className = {`w-full ${fieldErrors ? 'border-red-500' : ''}`}
required = { isRequired }
disabled = { field.disabled }
accept = { field.accept || '*/*' }
    />
                  ) : (
    <input
                      id= { fieldId }
type = { field.type }
name = { field.name }
value = { formValues[field.name] as string ?? ''}
onChange = {(e) => {
    onInputChange(field.name, e.target.value);
    if (errors[field.name]) {
        setErrors(prev => ({ ...prev, [field.name]: undefined }));
    }
}}
className = {`w-full border rounded p-2 ${fieldErrors ? 'border-red-500' : ''}`}
required = { isRequired }
disabled = { field.disabled }
readOnly = { field.readonly }
    />
                  )}
{
    fieldErrors && fieldErrors.map((error, index) => (
        <p key= { index } className = "text-red-500 text-sm mt-1" >
        { error }
        </p>
    ))
}
</div>
              );
            })}
</div>
    </div>

{/* Navigation buttons */ }
<div className="flex justify-between mt-6" >
    <button
            onClick={ handlePrevious }
disabled = { currentPage === 0}
className = {`px-4 py-2 rounded ${currentPage === 0
        ? 'bg-gray-300 cursor-not-allowed'
        : 'bg-blue-500 hover:bg-blue-600 text-white'
    }`}
          >
    Previous
    </button>

{
    currentPage === groups.length - 1 ? (
        <button
              onClick= { handleSubmit }
              className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
        Submit
        </button>
          ) : (
        <button
              onClick= { handleNext }
    className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
        Next
        </button>
          )
}
</div>
    </div>
    );
  });

// JSON Preview Component
const JsonPreview = memo<JsonPreviewProps>(({ onImport }) => {
    const [jsonInput, setJsonInput] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleImport = () => {
        try {
            const parsedJson = JSON.parse(jsonInput);
            if (!Array.isArray(parsedJson)) {
                throw new Error('JSON must be an array of groups');
            }

            const isValid = parsedJson.every((group): group is Group => {
                return (
                    typeof group === 'object' &&
                    group !== null &&
                    'name' in group &&
                    'fields' in group &&
                    Array.isArray((group as Group).fields)
                );
            });

            if (!isValid) {
                throw new Error('Invalid form structure');
            }

            onImport(parsedJson);
            setJsonInput('');
            setError('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid JSON format');
        }
    };

    return (
        <div className= "mt-6 space-y-4" >
        <div className="flex flex-col gap-2" >
            <label className="font-medium" > Import Form Definition </label>
                < textarea
    value = { jsonInput }
    onChange = {(e) => setJsonInput(e.target.value)}
className = "w-full h-40 p-2 border rounded-lg font-mono text-sm"
placeholder = "Paste your form JSON here..."
    />
    </div>
{ error && <p className="text-red-500 text-sm" > { error } </p> }
<button
          onClick={ handleImport }
className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
    Import JSON
        </button>
        </div>
    );
  });

// Main Form Builder Component
const FormBuilder = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [previewMode, setPreviewMode] = useState<boolean>(false);
    const [formValues, setFormValues] = useState<FormValues>({});

    const handleImportJson = useCallback((importedGroups: Group[]) => {
        setGroups(importedGroups);
        setFormValues({});
        setPreviewMode(false);
    }, []);

    const addGroup = () => {
        setGroups(prevGroups => [...prevGroups, {
            name: `Group ${prevGroups.length + 1}`,
            description: '',
            fields: []
        }]);
    };

    const addField = (groupIndex: number) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[groupIndex].fields.push({
                name: '',
                type: 'text',
                label: '',
                required: false,
                disabled: false,
                readonly: false,
                visible: true,
                options: [],
                required_if: [],
                visible_if: [],
                accept: '*/*',
            });
            return newGroups;
        });
    };

    const updateField = useCallback((groupIndex: number, fieldIndex: number, field: Field) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[groupIndex] = {
                ...newGroups[groupIndex],
                fields: [
                    ...newGroups[groupIndex].fields.slice(0, fieldIndex),
                    field,
                    ...newGroups[groupIndex].fields.slice(fieldIndex + 1)
                ]
            };
            return newGroups;
        });
    }, []);

    const removeField = useCallback((groupIndex: number, fieldIndex: number) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[groupIndex].fields.splice(fieldIndex, 1);
            return newGroups;
        });
    }, []);

    const addCondition = useCallback((groupIndex: number, fieldIndex: number, type: ConditionType) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const updatedField = {
                ...newGroups[groupIndex].fields[fieldIndex],
                [type]: [
                    ...newGroups[groupIndex].fields[fieldIndex][type],
                    { field: '', value: '', operator: 'equals' as OperatorType }
                ]
            };

            newGroups[groupIndex].fields[fieldIndex] = updatedField;
            return newGroups;
        });
    }, []);

    const removeCondition = useCallback((
        groupIndex: number,
        fieldIndex: number,
        type: ConditionType,
        conditionIndex: number
    ) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const updatedField = {
                ...newGroups[groupIndex].fields[fieldIndex],
                [type]: newGroups[groupIndex].fields[fieldIndex][type].filter((_, index) => index !== conditionIndex)
            };

            newGroups[groupIndex].fields[fieldIndex] = updatedField;
            return newGroups;
        });
    }, []);

    const handleInputChange = useCallback((name: string, value: string | boolean | File) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleDragField = useCallback((sourceIndex: number, targetIndex: number) => {
        setGroups(prevGroups => {
            return prevGroups.map(group => {
                const fields = [...group.fields];
                const [movedField] = fields.splice(sourceIndex, 1);
                fields.splice(targetIndex, 0, movedField);

                return {
                    ...group,
                    fields
                };
            });
        });
    }, []);

    return (
        <div className= "max-w-4xl mx-auto p-6" >
        <div className="flex justify-between mb-6" >
            <button
            onClick={ addGroup }
    className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
        >
        <Plus size={ 20 } className = "mr-1" /> Add Group
            </button>
            < button
    onClick = {() => setPreviewMode(!previewMode)}
className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
    >
{
    previewMode?(
              <>
    <EyeOff size={ 20 } className = "mr-1" /> Edit Mode
        </>
            ) : (
    <>
    <Eye size= { 20} className = "mr-1" /> Preview Mode
        </>
            )}
</button>
    </div>

{
    previewMode ? (
        <FormPreview
            groups= { groups }
            formValues = { formValues }
    onInputChange = { handleInputChange }
        />
        ) : (
        <>
        <div className= "space-y-6" >
        {
            groups.map((group, groupIndex) => (
                <div key= { groupIndex } className = "border p-4 rounded-lg" >
                <div className="space-y-3 mb-4" >
            <div className="flex justify-between items-center" >
            <input
                        type="text"
                        value = { group.name }
                        onChange = {(e) => {
                const newGroups = [...groups];
                newGroups[groupIndex].name = e.target.value;
                setGroups(newGroups);
            }}
    className = "text-lg font-semibold border-none focus:outline-none"
        />
        <button
                        onClick={ () => addField(groupIndex) }
    className = "bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
        >
        <Plus size={ 20 } className = "mr-1" /> Add Field
            </button>
            </div>
            < textarea
    value = { group.description || '' }
    onChange = {(e) => {
        const newGroups = [...groups];
        newGroups[groupIndex].description = e.target.value;
        setGroups(newGroups);
    }
}
placeholder = "Add group description (optional)"
className = "w-full border rounded-md p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
rows = { 2}
    />
    </div>
{
    group.fields.map((field, fieldIndex) => (
        <FieldBuilder
                      key= { fieldIndex }
                      group = { group }
                      groupIndex = { groupIndex }
                      field = { field }
                      fieldIndex = { fieldIndex }
                      onUpdateField = { updateField }
                      onRemoveField = { removeField }
                      onAddCondition = { addCondition }
                      onRemoveCondition = { removeCondition }
                      onDragField = { handleDragField }
        />
                  ))
}
</div>
              ))}
</div>

    < div className = "mt-6" >
        <h3 className="text-lg font-semibold mb-2" > Form preview: </h3>
            </div>
            </>
        )}

{
    !previewMode && (
        <div className="mt-6" >
            <h3 className="text-lg font-semibold mb-2" > Form JSON: </h3>
                < pre className = "bg-gray-100 p-4 rounded-lg overflow-auto" >
                    { JSON.stringify(groups, null, 2) }
                    </pre>
                    < JsonPreview onImport = { handleImportJson } />
                        </div>
        )
}
</div>
    );
  };

// Main Form Builder with JSON Component
const FormBuilderWithJson: React.FC = () => {
    const [formDefinition, setFormDefinition] = useState<FormDefinition>({
        groups: [],
        settings: {
            showSubmitButton: true,
            submitButtonText: 'Submit'
        }
    });

    const handleJsonImport = (importedJson: FormDefinition) => {
        setFormDefinition(importedJson);
    };

    const handleExportJson = () => {
        const jsonString = JSON.stringify(formDefinition, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'form-definition.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className= "max-w-6xl mx-auto p-6" >
        <div className="mb-8 space-y-4" >
            <h1 className="text-2xl font-bold" > Dynamic Form Builder </h1>
                < div className = "flex space-x-4" >
                    <button
              onClick={ handleExportJson }
    className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
        Export Form Definition
            </button>
            </div>
            </div>

            < div className = "grid grid-cols-1 lg:grid-cols-1 gap-8" >
                <div>
                <h2 className="text-xl font-semibold mb-4" > Form Builder </h2>
                    < FormBuilder
    formDefinition = { formDefinition }
    onChange = { setFormDefinition }
        />
        </div>
        </div>
        </div>
    );
  };

export default FormBuilderWithJson;