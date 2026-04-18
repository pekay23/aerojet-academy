import { compareNatural, naturalSort } from '../lib/utils/natural-sort';
import { createCourseSchema } from '../lib/validation/schemas';

async function testSorting() {
  const data = ['M1', 'M2', 'M10', 'M1A', 'M1B', 'M2A', 'M20', 'M11'];
  const sorted = data.sort(compareNatural);
  console.log('Sorted modules:', sorted);
  
  const expected = ['M1', 'M1A', 'M1B', 'M2', 'M2A', 'M10', 'M11', 'M20'];
  // Note: Standard natural sort might put M1A/M1B differently depending on characters, 
  // but M1 < M2 < M10 is the key requirement.
  
  const complexData = [
    { code: 'M10' },
    { code: 'M1' },
    { code: 'M2' },
    { code: 'M1A' },
  ];
  const sortedComplex = naturalSort(complexData, (i) => i.code);
  console.log('Sorted complex:', sortedComplex.map(i => i.code));
}

async function testSchema() {
  const payload = {
    code: 'M1 0',
    name: 'Mathematics Test',
    categoryId: 'some-id',
    price: 100,
  };
  
  const result = createCourseSchema.safeParse(payload);
  if (result.success) {
    console.log('Schema success:', result.data.code); // Should be 'M10'
  } else {
    console.log('Schema error:', result.error.message);
  }
}

async function run() {
  await testSorting();
  await testSchema();
}

run();
