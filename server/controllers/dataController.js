const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

// In-memory storage for customers and purchases
let customers = [];
let purchases = [];
let customerIdCounter = 1;
let purchaseIdCounter = 1;

// Helper function to calculate predictions based on customer behavior
const calculatePredictions = (customerId) => {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return [];

  const customerPurchases = purchases.filter(p => p.customerId === customerId);

  if (customerPurchases.length === 0) {
    // New customer - base predictions on demographics only
    return generateBasePredictions(customer);
  }

  // Calculate purchase patterns
  const purchaseFrequency = customerPurchases.length;
  const totalSpent = customerPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgOrderValue = totalSpent / purchaseFrequency;

  // Get unique categories purchased
  const categoriesPurchased = [...new Set(customerPurchases.map(p => p.category))];

  // Calculate recency (days since last purchase)
  const lastPurchaseDate = new Date(Math.max(...customerPurchases.map(p => new Date(p.date))));
  const daysSinceLastPurchase = Math.floor((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24));

  // Generate predictions for all product categories
  const allCategories = ['TV', 'Refrigerator', 'Washing Machine', 'AC', 'Microwave', 
                         'Laptop', 'Mobile', 'Camera', 'Speaker', 'Headphones'];

  return allCategories.map(category => {
    let buyProbability = 0;
    let riskScore = 50;

    // If customer already bought this category
    if (categoriesPurchased.includes(category)) {
      const categoryPurchases = customerPurchases.filter(p => p.category === category);
      const lastCategoryPurchase = new Date(Math.max(...categoryPurchases.map(p => new Date(p.date))));
      const daysSinceCategory = Math.floor((new Date() - lastCategoryPurchase) / (1000 * 60 * 60 * 24));

      // Replacement cycle (higher for expensive items)
      const replacementCycle = category === 'TV' || category === 'Refrigerator' ? 1825 : 
                              category === 'Laptop' || category === 'Mobile' ? 730 : 1095;

      buyProbability = Math.min(95, (daysSinceCategory / replacementCycle) * 100);
    } else {
      // Category not purchased yet - predict based on similar patterns
      buyProbability = 30 + (purchaseFrequency * 5) - (daysSinceLastPurchase * 0.5);
      buyProbability = Math.max(5, Math.min(70, buyProbability));
    }

    // Calculate risk score (inverse of engagement)
    if (daysSinceLastPurchase > 180) {
      riskScore = 80;
    } else if (daysSinceLastPurchase > 90) {
      riskScore = 60;
    } else if (daysSinceLastPurchase > 30) {
      riskScore = 30;
    } else {
      riskScore = 10;
    }

    // Adjust for purchase frequency
    riskScore = Math.max(0, riskScore - (purchaseFrequency * 5));

    return {
      category,
      buyProbability: Math.round(buyProbability * 10) / 10,
      riskScore: Math.round(riskScore),
      estimatedValue: Math.round(avgOrderValue * (buyProbability / 100)),
      recommendedAction: buyProbability > 60 ? 'High Priority Offer' : 
                        buyProbability > 30 ? 'Standard Marketing' : 'Build Awareness'
    };
  }).sort((a, b) => b.buyProbability - a.buyProbability);
};

const generateBasePredictions = (customer) => {
  const allCategories = ['TV', 'Refrigerator', 'Washing Machine', 'AC', 'Microwave', 
                         'Laptop', 'Mobile', 'Camera', 'Speaker', 'Headphones'];

  return allCategories.map(category => ({
    category,
    buyProbability: Math.round((Math.random() * 20 + 10) * 10) / 10,
    riskScore: 50,
    estimatedValue: 0,
    recommendedAction: 'Initial Contact'
  })).sort((a, b) => b.buyProbability - a.buyProbability);
};

exports.uploadExcel = async (req, res) => {
  try {
    console.log('Upload Excel endpoint hit');
    console.log('File:', req.file);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Read the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    console.log('Workbook sheets:', workbook.SheetNames);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('Parsed data:', data);
    console.log('Number of rows:', data.length);

    if (data.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Excel file is empty or has no valid data' 
      });
    }

    // Process and validate the data
    let importedCount = 0;
    const errors = [];

    data.forEach((row, index) => {
      // Check for required fields
      if (!row.name || !row.email) {
        errors.push(`Row ${index + 2}: Missing required fields (name or email)`);
        return;
      }

      // Check if email already exists
      const existingCustomer = customers.find(c => c.email === row.email);
      if (existingCustomer) {
        errors.push(`Row ${index + 2}: Email ${row.email} already exists`);
        return;
      }

      // Add customer
      customers.push({
        id: customerIdCounter++,
        name: String(row.name).trim(),
        email: String(row.email).trim().toLowerCase(),
        phone: row.phone ? String(row.phone).trim() : '',
        location: row.location ? String(row.location).trim() : '',
        joinDate: row.joinDate ? String(row.joinDate).split('T')[0] : new Date().toISOString().split('T')[0]
      });

      importedCount++;
    });

    console.log(`Successfully imported ${importedCount} customers`);
    console.log('Errors:', errors);

    res.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} customer(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`,
      imported: importedCount,
      errors: errors,
      customers: customers
    });

  } catch (error) {
    console.error('Error uploading Excel:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process Excel file',
      details: error.message 
    });
  }
};

exports.testConnection = async (req, res) => {
  try {
    const { host, user, password, database } = req.body;

    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database
    });

    await connection.ping();
    await connection.end();

    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to database',
      details: error.message 
    });
  }
};

exports.importFromDatabase = async (req, res) => {
  try {
    const { host, user, password, database, table } = req.body;

    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database
    });

    const [rows] = await connection.execute(`SELECT * FROM ${table}`);
    await connection.end();

    // Process imported data
    let importedCount = 0;
    rows.forEach(row => {
      if (row.name && row.email) {
        customers.push({
          id: customerIdCounter++,
          name: String(row.name).trim(),
          email: String(row.email).trim().toLowerCase(),
          phone: row.phone ? String(row.phone).trim() : '',
          location: row.location ? String(row.location).trim() : '',
          joinDate: row.joinDate ? String(row.joinDate).split('T')[0] : new Date().toISOString().split('T')[0]
        });
        importedCount++;
      }
    });

    res.json({ 
      success: true, 
      message: `Successfully imported ${importedCount} records`,
      customers: customers
    });
  } catch (error) {
    console.error('Database import error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import from database',
      details: error.message 
    });
  }
};

exports.getSampleFormat = (req, res) => {
  try {
    const sampleData = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '9876543210',
        location: 'Mumbai',
        joinDate: '2024-01-15'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543211',
        location: 'Delhi',
        joinDate: '2024-02-20'
      },
      {
        name: 'Amit Patel',
        email: 'amit@example.com',
        phone: '9876543212',
        location: 'Ahmedabad',
        joinDate: '2024-03-10'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=sample_customer_format.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating sample format:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate sample format',
      details: error.message 
    });
  }
};

exports.addCustomer = (req, res) => {
  try {
    const { name, email, phone, location } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and email are required' 
      });
    }

    // Check if email already exists
    const existingCustomer = customers.find(c => c.email === email.toLowerCase().trim());
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer with this email already exists' 
      });
    }

    const customer = {
      id: customerIdCounter++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      location: location ? location.trim() : '',
      joinDate: new Date().toISOString().split('T')[0]
    };

    customers.push(customer);
    console.log('Customer added:', customer);

    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add customer',
      details: error.message 
    });
  }
};

exports.getCustomers = (req, res) => {
  try {
    res.json({ 
      success: true,
      customers: customers 
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get customers',
      details: error.message 
    });
  }
};

exports.updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const index = customers.findIndex(c => c.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }

    customers[index] = { 
      ...customers[index], 
      ...req.body,
      id: customers[index].id // Preserve the original ID
    };

    res.json({ success: true, customer: customers[index] });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update customer',
      details: error.message 
    });
  }
};

exports.deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = customers.length;
    customers = customers.filter(c => c.id !== parseInt(id));

    if (customers.length === initialLength) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete customer',
      details: error.message 
    });
  }
};

exports.addPurchase = (req, res) => {
  try {
    const { customerId, category, amount, date } = req.body;

    // Validate required fields
    if (!customerId || !category || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer ID, category, and amount are required' 
      });
    }

    // Check if customer exists
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }

    const purchase = {
      id: purchaseIdCounter++,
      customerId: parseInt(customerId),
      category: category.trim(),
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0]
    };

    purchases.push(purchase);
    console.log('Purchase added:', purchase);

    res.json({ success: true, purchase });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add purchase',
      details: error.message 
    });
  }
};

exports.getPredictions = (req, res) => {
  try {
    const { customerId } = req.params;
    const predictions = calculatePredictions(parseInt(customerId));

    res.json({ 
      success: true,
      predictions: predictions 
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate predictions',
      details: error.message 
    });
  }
};