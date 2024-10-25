import React, { memo, useCallback, useState } from 'react';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';

// Memoized input components
const MemoizedFieldInput = memo(({ value, onChange, placeholder, className = "border rounded p-2" }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
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

const FieldBuilder = memo(({ 
  group, 
  groupIndex, 
  field, 
  fieldIndex, 
  onUpdateField,
  onRemoveField,
  onAddCondition,
  onRemoveCondition 
}) => {
  const handleFieldChange = useCallback((key, value) => {
    onUpdateField(groupIndex, fieldIndex, { ...field, [key]: value });
  }, [groupIndex, fieldIndex, onUpdateField, field]);

  // const handleRemoveField = useCallback(() => {
  //   onRemoveField(groupIndex, fieldIndex);
  // }, [groupIndex, fieldIndex, onRemoveField]);

  // const handleAddCondition = useCallback((type) => {
  //   onAddCondition(groupIndex, fieldIndex, type);
  // }, [groupIndex, fieldIndex, onAddCondition]);

  // const handleRemoveCondition = useCallback((type, conditionIndex) => {
  //   onRemoveCondition(groupIndex, fieldIndex, type, conditionIndex);
  // }, [groupIndex, fieldIndex, onRemoveCondition]);


  return (
    <div className="border p-4 rounded-lg mb-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <MemoizedFieldInput
          value={field.name}
          onChange={(value) => handleFieldChange('name', value)}
          placeholder="Field name"
        />
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
          </>}
        />
      </div>

      {field.type === 'select' && (
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
        <div>
          <h4 className="font-medium mb-2">Required If Conditions</h4>
          {field.required_if.map((condition, conditionIndex) => (
            <div key={conditionIndex} className="flex gap-2 mb-2">
              <MemoizedFieldInput
                value={condition.field}
                onChange={(value) => handleConditionChange('required_if', conditionIndex, 'field', value)}
                placeholder="Field name"
                className="border rounded p-2 flex-1"
              />
              <MemoizedSelect
                value={condition.operator}
                onChange={(value) => handleConditionChange('required_if', conditionIndex, 'operator', value)}
                options={<>
                  <option value="equals">Equals</option>
                  <option value="not_null">Not Null</option>
                </>}
              />
              <MemoizedFieldInput
                value={condition.value}
                onChange={(value) => handleConditionChange('required_if', conditionIndex, 'value', value)}
                placeholder="Value"
                className="border rounded p-2 flex-1"
              />
              <button
                onClick={() => onRemoveCondition(groupIndex, fieldIndex, 'required_if', conditionIndex)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onAddCondition(groupIndex, fieldIndex, 'required_if')}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <Plus size={20} className="mr-1" /> Add Condition
          </button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Visible If Conditions</h4>
          {field.visible_if.map((condition, conditionIndex) => (
            <div key={conditionIndex} className="flex gap-2 mb-2">
              <MemoizedFieldInput
                value={condition.field}
                onChange={(value) => handleConditionChange('visible_if', conditionIndex, 'field', value)}
                placeholder="Field name"
                className="border rounded p-2 flex-1"
              />
              <MemoizedSelect
                value={condition.operator}
                onChange={(value) => handleConditionChange('visible_if', conditionIndex, 'operator', value)}
                options={<>
                  <option value="equals">Equals</option>
                  <option value="not_null">Not Null</option>
                </>}
              />
              <MemoizedFieldInput
                value={condition.value}
                onChange={(value) => handleConditionChange('visible_if', conditionIndex, 'value', value)}
                placeholder="Value"
                className="border rounded p-2 flex-1"
              />
              <button
                onClick={() => onRemoveCondition(groupIndex, fieldIndex, 'visible_if', conditionIndex)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onAddCondition(groupIndex, fieldIndex, 'visible_if')}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <Plus size={20} className="mr-1" /> Add Condition
          </button>
        </div>
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

  const addGroup = () => {
    setGroups([...groups, { name: `Group ${groups.length + 1}`, fields: [] }]);
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
      visible_if: []
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
      const newGroups = [...prevGroups];
      const field = newGroups[groupIndex].fields[fieldIndex];
      field[type].push({ field: '', value: '', operator: 'equals' });
      return newGroups;
    });
  }, []);

  const removeCondition = useCallback((groupIndex, fieldIndex, type, conditionIndex) => {
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const field = newGroups[groupIndex].fields[fieldIndex];
      field[type].splice(conditionIndex, 1);
      return newGroups;
    });
  }, []);

  const FormPreview = () => {
    const checkConditions = (conditions, type) => {
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
    };

    const handleInputChange = (name, value) => {
      setFormValues(prev => ({ ...prev, [name]: value }));
    };

    return (
      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{group.name}</h3>
            <div className="space-y-4">
              {group.fields.map((field, fieldIndex) => {
                const isVisible = checkConditions(field.visible_if, 'visible');
                const isRequired = field.required || checkConditions(field.required_if, 'required');

                if (!isVisible) return null;

                return (
                  <div key={fieldIndex} className="space-y-2">
                    <label className="block text-sm font-medium">
                      {field.label}
                      {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full border rounded p-2"
                        required={isRequired}
                        disabled={field.disabled}
                        readOnly={field.readonly}
                      >
                        <option value="">Select an option</option>
                        {field.options.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
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
  };

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
        <FormPreview />
      ) : (
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
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
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!previewMode && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Form JSON:</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify(groups, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// JSON Preview Component to handle form data import
const JsonPreview = ({ onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      onImport(parsedJson);
      setError('');
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        className="w-full h-40 p-2 border rounded-lg font-mono text-sm"
        placeholder="Paste your form JSON here..."
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleImport}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Import JSON
      </button>
    </div>
  );
};

// Main Form Builder Component with JSON import/export functionality
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Form Builder</h2>
          <FormBuilder
            formDefinition={formDefinition}
            onChange={setFormDefinition}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Import JSON</h2>
          <JsonPreview onImport={handleJsonImport} />
        </div>
      </div>
    </div>
  );
};

// Validation utilities
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
    // Add more type-specific validation as needed
  }

  return errors;
};

// Custom Hook for form validation
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