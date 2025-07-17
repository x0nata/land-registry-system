// Test script to verify the validation logic works correctly
import * as Yup from 'yup';

// Copy of the updated validation schema
const propertyDetailsSchema = Yup.object({
  plotNumber: Yup.string().required('Plot number is required'),
  propertyType: Yup.string().required('Property type is required'),
  registrationType: Yup.string().required('Registration type is required'),
  area: Yup.string()
    .required('Area is required')
    .test('is-positive-number', 'Area must be a positive number', (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    }),
  subCity: Yup.string().required('Sub-city is required'),
  kebele: Yup.string().required('Kebele is required'),
  streetName: Yup.string(),
  houseNumber: Yup.string(),
  // Transfer-specific fields
  previousOwnerEmail: Yup.string().when('registrationType', {
    is: 'transferred_property',
    then: (schema) => schema.email('Invalid email').required('Previous owner email is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  transferType: Yup.string().when('registrationType', {
    is: 'transferred_property',
    then: (schema) => schema.required('Transfer type is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  transferValue: Yup.string().when('registrationType', {
    is: 'transferred_property',
    then: (schema) => schema.test('is-positive-number', 'Transfer value must be positive', (value) => {
      if (!value) return true; // Allow empty for nullable
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    }),
    otherwise: (schema) => schema.notRequired()
  }),
  transferReason: Yup.string().when('registrationType', {
    is: 'transferred_property',
    then: (schema) => schema.required('Transfer details are required').max(1000, 'Transfer details cannot exceed 1000 characters'),
    otherwise: (schema) => schema.notRequired()
  })
});

// Test cases
const testCases = [
  {
    name: 'Valid regular property',
    values: {
      plotNumber: 'P123',
      propertyType: 'residential',
      registrationType: 'new_registration',
      area: '100',
      subCity: 'Addis Ketema',
      kebele: '01'
    },
    shouldPass: true
  },
  {
    name: 'Invalid area (non-numeric)',
    values: {
      plotNumber: 'P123',
      propertyType: 'residential',
      registrationType: 'new_registration',
      area: 'abc',
      subCity: 'Addis Ketema',
      kebele: '01'
    },
    shouldPass: false
  },
  {
    name: 'Valid transferred property',
    values: {
      plotNumber: 'P123',
      propertyType: 'residential',
      registrationType: 'transferred_property',
      area: '100',
      subCity: 'Addis Ketema',
      kebele: '01',
      previousOwnerEmail: 'previous@example.com',
      transferType: 'sale',
      transferReason: 'Property sold to new owner'
    },
    shouldPass: true
  }
];

// Run tests
console.log('Running validation tests...');
testCases.forEach(testCase => {
  try {
    propertyDetailsSchema.validateSync(testCase.values, { abortEarly: false });
    console.log(`✅ ${testCase.name}: PASSED (validation successful)`);
    if (!testCase.shouldPass) {
      console.log(`❌ Expected this test to fail but it passed`);
    }
  } catch (error) {
    console.log(`❌ ${testCase.name}: FAILED (${error.errors.join(', ')})`);
    if (testCase.shouldPass) {
      console.log(`❌ Expected this test to pass but it failed`);
    } else {
      console.log(`✅ Expected failure - test working correctly`);
    }
  }
});
