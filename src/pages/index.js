import React, { memo, useCallback, useState } from 'react';
import { Trash2, Plus, Eye, EyeOff, GripVertical } from 'lucide-react';

const MemoizedFieldInput = memo(({ value, onChange, placeholder, className = "border rounded p-2" }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={className}
  />
));

const MemoizedSelect = memo(({ value, onChange, options, className = "border rounded p-2" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={className}
  >
    {options}
  </select>
));

const MemoizedCheckbox = memo(({ checked, onChange, label }) => (
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mr-2"
    />
    {label}
  </label>
));

const generateFieldName = (label) => {
  return label
    .toLowerCase()            // convert to lowercase
    .replace(/\s+/g, '_')    // replace spaces with underscore
    .replace(/[^a-z0-9_]/g, ''); // remove special characters except underscore
};

const FieldBuilder = memo(({
  group,
  groupIndex,
  field,
  fieldIndex,
  onUpdateField,
  onRemoveField,
  onAddCondition,
  onRemoveCondition,
  onDragField
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFieldChange = useCallback((key, value) => {
    if (key === 'label') {
      onUpdateField(groupIndex, fieldIndex, { 
        ...field, 
        label: value,
        name: generateFieldName(value)
      });
    } else {
      onUpdateField(groupIndex, fieldIndex, { ...field, [key]: value });
    }
  }, [groupIndex, fieldIndex, onUpdateField, field]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      groupIndex,
      fieldIndex,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    // Only reorder if dropping on a different field
    if (data.groupIndex === groupIndex && data.fieldIndex !== fieldIndex) {
      onDragField(data.fieldIndex, fieldIndex);
    }
  };

  const handleConditionChange = useCallback((type, conditionIndex, key, value) => {
    const newField = { ...field };
    newField[type][conditionIndex] = {
      ...newField[type][conditionIndex],
      [key]: value
    };
    onUpdateField(groupIndex, fieldIndex, newField);
  }, [field, groupIndex, fieldIndex, onUpdateField]);

  const renderConditions = useCallback((type, title) => (
    <div>
      <h4 className="font-medium mb-2">{title}</h4>
      {field[type].map((condition, conditionIndex) => (
        <div key={`${type}-${conditionIndex}`} className="flex gap-2 mb-2">
          <MemoizedFieldInput
            value={condition.field}
            onChange={(value) => handleConditionChange(type, conditionIndex, 'field', value)}
            placeholder="Field name"
            className="border rounded p-2 flex-1"
          />
          <MemoizedSelect
            value={condition.operator}
            onChange={(value) => handleConditionChange(type, conditionIndex, 'operator', value)}
            options={<>
              <option value="equals">Equals</option>
              <option value="not_null">Not Null</option>
            </>}
            className="border rounded p-2"
          />
          <MemoizedFieldInput
            value={condition.value}
            onChange={(value) => handleConditionChange(type, conditionIndex, 'value', value)}
            placeholder="Value"
            className="border rounded p-2 flex-1"
          />
          <button
            onClick={() => onRemoveCondition(groupIndex, fieldIndex, type, conditionIndex)}
            className="p-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onAddCondition(groupIndex, fieldIndex, type)}
        className="flex items-center text-blue-500 hover:text-blue-700"
      >
        <Plus size={20} className="mr-1" /> Add Condition
      </button>
    </div>
  ), [field, groupIndex, fieldIndex, handleConditionChange, onAddCondition, onRemoveCondition]);

  return (
    <div 
      className={`border p-4 rounded-lg mb-4 transition-colors ${
        isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <GripVertical className="text-gray-400" size={20} />
          <h3 className="font-medium">{field.label || 'New Field'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <MemoizedFieldInput
          value={field.label}
          onChange={(value) => handleFieldChange('label', value)}
          placeholder="Label"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <MemoizedSelect
          value={field.type}
          onChange={(value) => handleFieldChange('type', value)}
          options={<>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="select">Select</option>
            <option value="file">File Upload</option>
            <option value="radio">Radio</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Calendar</option>
          </>}
        />
      </div>

      {(field.type === 'select' || field.type === 'radio') && (
        <div className="mb-4">
          <MemoizedFieldInput
            value={field.options.join(',')}
            onChange={(value) => handleFieldChange('options', value.split(',').map(opt => opt.trim()))}
            placeholder="Options (comma-separated)"
            className="border rounded p-2 w-full"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <MemoizedCheckbox
          checked={field.required}
          onChange={(checked) => handleFieldChange('required', checked)}
          label="Required"
        />
        <MemoizedCheckbox
          checked={field.disabled}
          onChange={(checked) => handleFieldChange('disabled', checked)}
          label="Disabled"
        />
        <MemoizedCheckbox
          checked={field.readonly}
          onChange={(checked) => handleFieldChange('readonly', checked)}
          label="Readonly"
        />
        <MemoizedCheckbox
          checked={field.visible}
          onChange={(checked) => handleFieldChange('visible', checked)}
          label="Visible"
        />
      </div>

      <div className="space-y-4">
        {renderConditions('required_if', 'Required If Conditions')}
        {renderConditions('visible_if', 'Visible If Conditions')}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onRemoveField(groupIndex, fieldIndex)}
          className="text-red-500 hover:text-red-700 flex items-center"
        >
          <Trash2 size={20} className="mr-1" /> Remove Field
        </button>
      </div>
    </div>
  );
});

const FormBuilder = () => {
  const [groups, setGroups] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [formValues, setFormValues] = useState({});

  // Add handleImportJson function
  const handleImportJson = useCallback((importedGroups) => {
    setGroups(importedGroups);
    // Reset form values when importing new structure
    setFormValues({});
    // Switch to builder mode to show the imported structure
    setPreviewMode(false);
  }, []);

  const addGroup = () => {
    setGroups([...groups, { 
      name: `Group ${groups.length + 1}`, 
      description: '',
      fields: [] 
    }]);
  };

  const addField = (groupIndex) => {
    const newGroups = [...groups];
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
      accept: '*/*', // for file input
    });
    setGroups(newGroups);
  };

  const updateField = useCallback((groupIndex, fieldIndex, field) => {
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


  const removeField = useCallback((groupIndex, fieldIndex) => {
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex].fields.splice(fieldIndex, 1);
      return newGroups;
    });
  }, []);

  const addCondition = useCallback((groupIndex, fieldIndex, type) => {
    setGroups(prevGroups => {
      // Create new field object with updated conditions
      const updatedField = {
        ...prevGroups[groupIndex].fields[fieldIndex],
        [type]: [
          ...prevGroups[groupIndex].fields[fieldIndex][type],
          { field: '', value: '', operator: 'equals' }
        ]
      };

      // Create new groups array with updated field
      const newGroups = prevGroups.map((group, gIndex) => {
        if (gIndex === groupIndex) {
          return {
            ...group,
            fields: group.fields.map((field, fIndex) => {
              if (fIndex === fieldIndex) {
                return updatedField;
              }
              return field;
            })
          };
        }
        return group;
      });
      return newGroups;
    });
  }, []);

  const removeCondition = useCallback((groupIndex, fieldIndex, type, conditionIndex) => {
    setGroups(prevGroups => {
      // Create new field object with updated conditions
      const updatedField = {
        ...prevGroups[groupIndex].fields[fieldIndex],
        [type]: prevGroups[groupIndex].fields[fieldIndex][type].filter((_, index) => index !== conditionIndex)
      };

      // Create new groups array with updated field
      const newGroups = prevGroups.map((group, gIndex) => {
        if (gIndex === groupIndex) {
          return {
            ...group,
            fields: group.fields.map((field, fIndex) => {
              if (fIndex === fieldIndex) {
                return updatedField;
              }
              return field;
            })
          };
        }
        return group;
      });

      return newGroups;
    });
  }, []);

  const handleInputChange = useCallback((name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleDragField = useCallback((sourceIndex, targetIndex) => {
    setGroups(prevGroups => {
      return prevGroups.map((group, groupIndex) => {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between mb-6">
        <button
          onClick={addGroup}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
        >
          <Plus size={20} className="mr-1" /> Add Group
        </button>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          {previewMode ? (
            <>
              <EyeOff size={20} className="mr-1" /> Edit Mode
            </>
          ) : (
            <>
              <Eye size={20} className="mr-1" /> Preview Mode
            </>
          )}
        </button>
      </div>

      {previewMode ? (
        <FormPreview
          groups={groups}
          formValues={formValues}
          onInputChange={handleInputChange}
        />
      ) : (
        <>
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="border p-4 rounded-lg">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...groups];
                        newGroups[groupIndex].name = e.target.value;
                        setGroups(newGroups);
                      }}
                      className="text-lg font-semibold border-none focus:outline-none"
                    />
                    <button
                      onClick={() => addField(groupIndex)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                    >
                      <Plus size={20} className="mr-1" /> Add Field
                    </button>
                  </div>
                  <textarea
                    value={group.description || ''}
                    onChange={(e) => {
                      const newGroups = [...groups];
                      newGroups[groupIndex].description = e.target.value;
                      setGroups(newGroups);
                    }}
                    placeholder="Add group description (optional)"
                    className="w-full border rounded-md p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                {group.fields.map((field, fieldIndex) => (
                  <FieldBuilder
                    key={fieldIndex}
                    group={group}
                    groupIndex={groupIndex}
                    field={field}
                    fieldIndex={fieldIndex}
                    onUpdateField={updateField}
                    onRemoveField={removeField}
                    onAddCondition={addCondition}
                    onRemoveCondition={removeCondition}
                    onDragField={handleDragField}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Form preview:</h3>
          </div>
        </>
      )}

      {!previewMode && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Form JSON:</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify(groups, null, 2)}
          </pre>
          <JsonPreview onImport={handleImportJson} />
        </div>
      )}
    </div>
  );
};

const FormPreview = memo(({ groups, formValues, onInputChange }) => {
  const checkConditions = useCallback((conditions, type) => {
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

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div key={`group-${group.name}-${groupIndex}`} className="border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
          {group.description && (
            <p className="text-gray-600 text-sm mb-4">{group.description}</p>
          )}
          <div className="space-y-4">
            {group.fields.map((field, fieldIndex) => {
              const isVisible = checkConditions(field.visible_if, 'visible');
              const isRequired = field.required || checkConditions(field.required_if, 'required');
              const fieldId = `${group.name}-${field.name}-${fieldIndex}`;

              if (!isVisible) return null;

              return (
                <div key={fieldId} className="space-y-2">
                  <label htmlFor={fieldId} className="block text-sm font-medium">
                    {field.label}
                    {isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={fieldId}
                      name={field.name}
                      value={formValues[field.name] ?? ''}
                      onChange={(e) => onInputChange(field.name, e.target.value)}
                      className="w-full border rounded p-2"
                      required={isRequired}
                      disabled={field.disabled}
                      readOnly={field.readonly}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option, i) => (
                        <option key={`${fieldId}-option-${i}`} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2">
                      {field.options.map((option, i) => (
                        <label key={`${fieldId}-option-${i}`} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={field.name}
                            value={option}
                            checked={formValues[field.name] === option}
                            onChange={(e) => onInputChange(field.name, e.target.value)}
                            required={isRequired}
                            disabled={field.disabled}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <input
                      id={fieldId}
                      type="checkbox"
                      name={field.name}
                      checked={formValues[field.name] || false}
                      onChange={(e) => onInputChange(field.name, e.target.checked)}
                      className="rounded border-gray-300"
                      required={isRequired}
                      disabled={field.disabled}
                    />
                  ) : field.type === 'file' ? (
                    <input
                      id={fieldId}
                      type="file"
                      name={field.name}
                      onChange={(e) => onInputChange(field.name, e.target.files[0])}
                      className="w-full"
                      required={isRequired}
                      disabled={field.disabled}
                      accept={field.accept || '*/*'}
                    />
                  ) : field.type === 'date' ? (
                    <input
                      id={fieldId}
                      type="date"
                      name={field.name}
                      value={formValues[field.name] ?? ''}
                      onChange={(e) => onInputChange(field.name, e.target.value)}
                      className="w-full border rounded p-2"
                      required={isRequired}
                      disabled={field.disabled}
                      readOnly={field.readonly}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      type={field.type}
                      name={field.name}
                      value={formValues[field.name] ?? ''}
                      onChange={(e) => onInputChange(field.name, e.target.value)}
                      className="w-full border rounded p-2"
                      required={isRequired}
                      disabled={field.disabled}
                      readOnly={field.readonly}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={() => console.log(formValues)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Submit
      </button>
    </div>
  );
});

const JsonPreview = memo(({ onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      // Validate that the JSON structure matches our expected format
      if (!Array.isArray(parsedJson)) {
        throw new Error('JSON must be an array of groups');
      }

      // Basic validation of the JSON structure
      const isValid = parsedJson.every(group => {
        return (
          typeof group === 'object' &&
          'name' in group &&
          'fields' in group &&
          Array.isArray(group.fields)
        );
      });

      if (!isValid) {
        throw new Error('Invalid form structure');
      }

      onImport(parsedJson);
      setJsonInput('');
      setError('');
    } catch (e) {
      setError(e.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-2">
        <label className="font-medium">Import Form Definition</label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-40 p-2 border rounded-lg font-mono text-sm"
          placeholder="Paste your form JSON here..."
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleImport}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Import JSON
      </button>
    </div>
  );
});

const FormBuilderWithJson = () => {
  const [formDefinition, setFormDefinition] = useState({
    groups: [],
    settings: {
      showSubmitButton: true,
      submitButtonText: 'Submit'
    }
  });

  const handleJsonImport = (importedJson) => {
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold">Dynamic Form Builder</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleExportJson}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export Form Definition
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Form Builder</h2>
          <FormBuilder
            formDefinition={formDefinition}
            onChange={setFormDefinition}
          />
        </div>
      </div>
    </div>
  );
};

const validateField = (field, formValues) => {
  const errors = [];

  // Check required validation
  if (field.required && !formValues[field.name]) {
    errors.push('This field is required');
  }

  // Check required_if conditions
  if (field.required_if && field.required_if.length > 0) {
    const isRequired = field.required_if.every(condition => {
      const dependentValue = formValues[condition.field];
      switch (condition.operator) {
        case 'equals':
          return dependentValue === condition.value;
        case 'not_null':
          return dependentValue != null && dependentValue !== '';
        default:
          return false;
      }
    });

    if (isRequired && !formValues[field.name]) {
      errors.push('This field is conditionally required');
    }
  }

  // Add type-specific validation
  switch (field.type) {
    case 'email':
      if (formValues[field.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues[field.name])) {
        errors.push('Invalid email format');
      }
      break;
    case 'number':
      if (formValues[field.name] && isNaN(formValues[field.name])) {
        errors.push('Must be a valid number');
      }
      break;
    case 'file':
      if (formValues[field.name]) {
        const file = formValues[field.name];
        if (field.maxSize && file.size > field.maxSize) {
          errors.push('File size exceeds maximum allowed');
        }
        if (field.accept && !field.accept.split(',').some(type => 
          file.type.match(new RegExp(type.replace('*', '.*')))
        )) {
          errors.push('Invalid file type');
        }
      }
      break;
  }

  return errors;
};

const useFormValidation = (formDefinition, formValues) => {
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const newErrors = {};
    formDefinition.groups.forEach(group => {
      group.fields.forEach(field => {
        const fieldErrors = validateField(field, formValues);
        if (fieldErrors.length > 0) {
          newErrors[field.name] = fieldErrors;
        }
      });
    });
    setErrors(newErrors);
  }, [formDefinition, formValues]);

  return errors;
};

export default FormBuilderWithJson;