import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterBuyProb, setFilterBuyProb] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

 
  const [purchaseForm, setPurchaseForm] = useState({
    customerId: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  
  const [dbForm, setDbForm] = useState({
    host: 'localhost',
    user: '',
    password: '',
    database: '',
    table: 'customers'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/data/customers`);
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      showMessage('error', 'Failed to load customers');
    }
  };

  const loadPredictions = async (customerId) => {
    try {
      const response = await axios.get(`${API_URL}/data/predictions/${customerId}`);
      if (response.data.success) {
        setPredictions(response.data.predictions || []);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      showMessage('error', 'Failed to load predictions');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/data/customers`, customerForm);
      if (response.data.success) {
        setCustomers([...customers, response.data.customer]);
        setCustomerForm({ name: '', email: '', phone: '', location: '' });
        showMessage('success', 'Customer added successfully!');
      } else {
        showMessage('error', response.data.error || 'Failed to add customer');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add customer';
      showMessage('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/data/purchases`, purchaseForm);
      if (response.data.success) {
        setPurchaseForm({
          customerId: '',
          category: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        showMessage('success', 'Purchase recorded successfully!');

        // Reload predictions if customer is selected
        if (selectedCustomer) {
          loadPredictions(selectedCustomer.id);
        }
      } else {
        showMessage('error', response.data.error || 'Failed to record purchase');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to record purchase';
      showMessage('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      showMessage('error', 'Please upload a valid Excel file (.xlsx or .xls)');
      e.target.value = ''; // Reset file input
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name);
      const response = await axios.post(`${API_URL}/data/upload-excel`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        setCustomers(response.data.customers || []);

        let successMsg = response.data.message;
        if (response.data.errors && response.data.errors.length > 0) {
          successMsg += '\n\nErrors:\n' + response.data.errors.slice(0, 5).join('\n');
          if (response.data.errors.length > 5) {
            successMsg += `\n... and ${response.data.errors.length - 5} more errors`;
          }
        }

        showMessage('success', successMsg);
      } else {
        showMessage('error', response.data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Failed to upload Excel file. Please check the file format.';
      showMessage('error', errorMsg);
    } finally {
      setIsLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDatabaseImport = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/data/import-database`, dbForm);
      if (response.data.success) {
        setCustomers(response.data.customers || []);
        showMessage('success', response.data.message);
      } else {
        showMessage('error', response.data.error || 'Failed to import from database');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to import from database';
      showMessage('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleFormat = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/data/sample-format`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_customer_format.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage('success', 'Sample format downloaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to download sample format');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    loadPredictions(customer.id);
    setActiveTab('predictions');
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/data/customers/${customerId}`);
      if (response.data.success) {
        setCustomers(customers.filter(c => c.id !== customerId));
        if (selectedCustomer && selectedCustomer.id === customerId) {
          setSelectedCustomer(null);
          setPredictions([]);
        }
        showMessage('success', 'Customer deleted successfully');
      } else {
        showMessage('error', response.data.error || 'Failed to delete customer');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete customer';
      showMessage('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter predictions
  const filteredPredictions = predictions.filter(pred => {
    let passRisk = true;
    let passBuyProb = true;

    if (filterRisk !== 'all') {
      if (filterRisk === 'high' && pred.riskScore < 60) passRisk = false;
      if (filterRisk === 'medium' && (pred.riskScore < 30 || pred.riskScore >= 60)) passRisk = false;
      if (filterRisk === 'low' && pred.riskScore >= 30) passRisk = false;
    }

    if (filterBuyProb !== 'all') {
      if (filterBuyProb === 'high' && pred.buyProbability < 60) passBuyProb = false;
      if (filterBuyProb === 'medium' && (pred.buyProbability < 30 || pred.buyProbability >= 60)) passBuyProb = false;
      if (filterBuyProb === 'low' && pred.buyProbability >= 30) passBuyProb = false;
    }

    return passRisk && passBuyProb;
  });

  const categories = ['TV', 'Refrigerator', 'Washing Machine', 'AC', 'Microwave', 
                      'Laptop', 'Mobile', 'Camera', 'Speaker', 'Headphones'];

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>🏪 Patel Electronics</h1>
          <p>Customer Analytics & Purchase Prediction Dashboard</p>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            disabled={isLoading}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
            disabled={isLoading}
          >
            👥 Manage Customers
          </button>
          <button 
            className={`tab ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictions')}
            disabled={isLoading}
          >
            🎯 Predictions
          </button>
          <button 
            className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
            disabled={isLoading}
          >
            🛒 Add Purchase
          </button>
          <button 
            className={`tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
            disabled={isLoading}
          >
            📥 Import Data
          </button>
        </div>

        {isLoading && (
          <div className="alert alert-info" style={{
            background: '#d1ecf1',
            color: '#0c5460',
            border: '1px solid #bee5eb'
          }}>
            ⏳ Processing...
          </div>
        )}

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              fontSize: '0.95rem'
            }}>
              {message.text}
            </pre>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="content-section">
            <h2 className="section-title">Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{customers.length}</div>
                <div className="stat-label">Total Customers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {customers.filter(c => {
                    const joinDate = new Date(c.joinDate);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return joinDate >= thirtyDaysAgo;
                  }).length}
                </div>
                <div className="stat-label">New This Month</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {selectedCustomer ? predictions.filter(p => p.buyProbability > 60).length : '-'}
                </div>
                <div className="stat-label">High Priority Opportunities</div>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '20px', color: '#667eea' }}>Recent Customers</h3>
              {customers.length > 0 ? (
                <div className="customers-grid">
                  {customers.slice(-6).reverse().map(customer => (
                    <div 
                      key={customer.id} 
                      className="customer-card"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <h3>{customer.name}</h3>
                      <p>📧 {customer.email}</p>
                      <p>📱 {customer.phone || 'N/A'}</p>
                      <p>📍 {customer.location || 'N/A'}</p>
                      <p>📅 Joined: {customer.joinDate}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  No customers yet. Add customers or import data to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="content-section">
            <h2 className="section-title">Manage Customers</h2>

            <form onSubmit={handleAddCustomer}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={customerForm.location}
                    onChange={(e) => setCustomerForm({...customerForm, location: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button type="submit" className="btn" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Customer'}
              </button>
            </form>

            <div style={{ marginTop: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: '#667eea' }}>All Customers ({customers.length})</h3>
              {customers.length > 0 ? (
                <div className="customers-grid">
                  {customers.map(customer => (
                    <div 
                      key={customer.id} 
                      className={`customer-card ${selectedCustomer && selectedCustomer.id === customer.id ? 'selected' : ''}`}
                    >
                      <h3>{customer.name}</h3>
                      <p>📧 {customer.email}</p>
                      <p>📱 {customer.phone || 'N/A'}</p>
                      <p>📍 {customer.location || 'N/A'}</p>
                      <p>📅 Joined: {customer.joinDate}</p>
                      <div style={{ marginTop: '15px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                          onClick={() => handleCustomerSelect(customer)}
                          disabled={isLoading}
                        >
                          View Predictions
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer.id);
                          }}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  No customers yet. Add your first customer above or import data.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="content-section">
            <h2 className="section-title">Purchase Predictions</h2>

            {!selectedCustomer && (
              <div className="no-data">
                Please select a customer from the Customers tab or Dashboard to view predictions.
              </div>
            )}

            {selectedCustomer && (
              <>
                <div style={{ 
                  background: '#e8eaf6', 
                  padding: '20px', 
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ color: '#667eea', marginBottom: '10px' }}>
                    Selected Customer: {selectedCustomer.name}
                  </h3>
                  <p>📧 {selectedCustomer.email}</p>
                  <p>📱 {selectedCustomer.phone || 'N/A'}</p>
                  <p>📍 {selectedCustomer.location || 'N/A'}</p>
                </div>

                <div className="filter-section">
                  <label>Risk Level:</label>
                  <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                    <option value="all">All</option>
                    <option value="high">High (60+)</option>
                    <option value="medium">Medium (30-59)</option>
                    <option value="low">Low (0-29)</option>
                  </select>

                  <label>Buy Probability:</label>
                  <select value={filterBuyProb} onChange={(e) => setFilterBuyProb(e.target.value)}>
                    <option value="all">All</option>
                    <option value="high">High (60%+)</option>
                    <option value="medium">Medium (30-59%)</option>
                    <option value="low">Low (0-29%)</option>
                  </select>
                </div>

                <div className="predictions-grid">
                  {filteredPredictions.map((pred, index) => (
                    <div 
                      key={index} 
                      className={`prediction-card ${pred.buyProbability > 60 ? 'high-priority' : ''}`}
                    >
                      <h4>{pred.category}</h4>
                      <div className="prediction-metric">
                        <span className="metric-label">Buy Probability:</span>
                        <span className="metric-value">{pred.buyProbability}%</span>
                      </div>
                      <div className="prediction-metric">
                        <span className="metric-label">Risk Score:</span>
                        <span className="metric-value">{pred.riskScore}</span>
                      </div>
                      <div className="prediction-metric">
                        <span className="metric-label">Est. Value:</span>
                        <span className="metric-value">₹{pred.estimatedValue}</span>
                      </div>
                      <div className="prediction-metric">
                        <span className="metric-label">Action:</span>
                        <span className="metric-value" style={{ fontSize: '0.85rem' }}>
                          {pred.recommendedAction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPredictions.length === 0 && (
                  <div className="no-data">
                    No predictions match the selected filters.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="content-section">
            <h2 className="section-title">Record Customer Purchase</h2>

            <div className="purchase-form">
              <form onSubmit={handleAddPurchase}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer *</label>
                    <select
                      value={purchaseForm.customerId}
                      onChange={(e) => setPurchaseForm({...purchaseForm, customerId: e.target.value})}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Product Category *</label>
                    <select
                      value={purchaseForm.category}
                      onChange={(e) => setPurchaseForm({...purchaseForm, category: e.target.value})}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                      type="number"
                      value={purchaseForm.amount}
                      onChange={(e) => setPurchaseForm({...purchaseForm, amount: e.target.value})}
                      required
                      min="0"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Purchase Date *</label>
                    <input
                      type="date"
                      value={purchaseForm.date}
                      onChange={(e) => setPurchaseForm({...purchaseForm, date: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading ? 'Recording...' : 'Record Purchase'}
                </button>
              </form>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <h3 style={{ color: '#667eea', marginBottom: '15px' }}>ℹ️ About Purchase Recording</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Recording customer purchases helps the system learn buying patterns and improve 
                prediction accuracy. The more purchase history a customer has, the more accurate 
                their predictions will be. Predictions are calculated dynamically based on:
              </p>
              <ul style={{ marginTop: '10px', color: '#666', lineHeight: '1.8' }}>
                <li>Purchase frequency and recency</li>
                <li>Average order value</li>
                <li>Product categories purchased</li>
                <li>Time since last purchase</li>
                <li>Replacement cycles for different product types</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="content-section">
            <h2 className="section-title">Import Customer Data</h2>

            <div className="import-section">
              <h3 style={{ color: '#667eea', marginBottom: '15px' }}>📄 Import from Excel</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Upload an Excel file (.xlsx or .xls) with customer information.<br/>
                <strong>Required columns:</strong> name, email<br/>
                <strong>Optional columns:</strong> phone, location, joinDate
              </p>
              <button 
                onClick={downloadSampleFormat} 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? 'Downloading...' : 'Download Sample Format'}
              </button>
              <div className="file-input" style={{ marginTop: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  padding: '15px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '2px dashed #667eea',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <strong>Click to select Excel file</strong> (.xlsx or .xls)
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="import-section">
              <h3 style={{ color: '#667eea', marginBottom: '15px' }}>🗄️ Import from Database</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Connect to your MySQL database and import customer data.
              </p>
              <form onSubmit={handleDatabaseImport}>
                <div className="db-form">
                  <div className="form-group">
                    <label>Host</label>
                    <input
                      type="text"
                      value={dbForm.host}
                      onChange={(e) => setDbForm({...dbForm, host: e.target.value})}
                      placeholder="localhost"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>User</label>
                    <input
                      type="text"
                      value={dbForm.user}
                      onChange={(e) => setDbForm({...dbForm, user: e.target.value})}
                      placeholder="root"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={dbForm.password}
                      onChange={(e) => setDbForm({...dbForm, password: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Database</label>
                    <input
                      type="text"
                      value={dbForm.database}
                      onChange={(e) => setDbForm({...dbForm, database: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Table</label>
                    <input
                      type="text"
                      value={dbForm.table}
                      onChange={(e) => setDbForm({...dbForm, table: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading ? 'Importing...' : 'Import from Database'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;