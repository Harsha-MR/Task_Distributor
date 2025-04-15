const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test files
const testFiles = {
  validCSV: path.join(__dirname, 'test-files', 'valid.csv'),
  validXLSX: path.join(__dirname, 'test-files', 'valid.xlsx'),
  invalidTXT: path.join(__dirname, 'test-files', 'invalid.txt'),
  invalidPDF: path.join(__dirname, 'test-files', 'invalid.pdf')
};

// Create test files
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  // Create valid CSV
  fs.writeFileSync(testFiles.validCSV, 'FirstName,Phone,Notes\nJohn,1234567890,Test note');

  // Create valid XLSX (empty file for testing)
  fs.writeFileSync(testFiles.validXLSX, '');

  // Create invalid files
  fs.writeFileSync(testFiles.invalidTXT, 'This is a test text file');
  fs.writeFileSync(testFiles.invalidPDF, '%PDF-1.4\n%EOF');
}

// Clean up test files
function cleanupTestFiles() {
  Object.values(testFiles).forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
  fs.rmdirSync(path.join(__dirname, 'test-files'));
}

// Test function
async function testFileUpload() {
  try {
    // Create test files
    createTestFiles();

    // Get token (you'll need to replace this with your actual login logic)
    const token = 'your-auth-token';

    // Test valid CSV
    console.log('Testing valid CSV upload...');
    const validCSVFormData = new FormData();
    validCSVFormData.append('file', fs.createReadStream(testFiles.validCSV));
    
    try {
      const response = await axios.post('http://localhost:5000/api/tasks/upload', validCSVFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Valid CSV upload successful');
    } catch (error) {
      console.error('❌ Valid CSV upload failed:', error.response?.data?.message || error.message);
    }

    // Test valid XLSX
    console.log('\nTesting valid XLSX upload...');
    const validXLSXFormData = new FormData();
    validXLSXFormData.append('file', fs.createReadStream(testFiles.validXLSX));
    
    try {
      const response = await axios.post('http://localhost:5000/api/tasks/upload', validXLSXFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Valid XLSX upload successful');
    } catch (error) {
      console.error('❌ Valid XLSX upload failed:', error.response?.data?.message || error.message);
    }

    // Test invalid TXT
    console.log('\nTesting invalid TXT upload...');
    const invalidTXTFormData = new FormData();
    invalidTXTFormData.append('file', fs.createReadStream(testFiles.invalidTXT));
    
    try {
      const response = await axios.post('http://localhost:5000/api/tasks/upload', invalidTXTFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      console.error('❌ Invalid TXT upload should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid TXT upload correctly rejected');
      } else {
        console.error('❌ Invalid TXT upload failed with unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test invalid PDF
    console.log('\nTesting invalid PDF upload...');
    const invalidPDFFormData = new FormData();
    invalidPDFFormData.append('file', fs.createReadStream(testFiles.invalidPDF));
    
    try {
      const response = await axios.post('http://localhost:5000/api/tasks/upload', invalidPDFFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      console.error('❌ Invalid PDF upload should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid PDF upload correctly rejected');
      } else {
        console.error('❌ Invalid PDF upload failed with unexpected error:', error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test files
    cleanupTestFiles();
  }
}

// Run the tests
testFileUpload(); 