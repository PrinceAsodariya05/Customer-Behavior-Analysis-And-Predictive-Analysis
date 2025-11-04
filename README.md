<<<<<<< HEAD
# Customer-Behavior-Analysis-And-Predictive-Analysis
=======
# Patel Electronics - Customer Analytics Dashboard

A comprehensive customer analytics dashboard with dynamic purchase predictions based on customer behavior.

## ✨ What's Fixed in This Version

**Excel Upload Issue - RESOLVED ✅**
- Fixed file processing and data parsing
- Added comprehensive validation
- Enhanced error messages
- Better user feedback

## Quick Start

### Installation

1. **Extract the ZIP file**
2. **Install dependencies:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. **Start the server:**
   ```bash
   cd server && npm start
   ```
4. **Start the client (new terminal):**
   ```bash
   cd client && npm start
   ```

### Using Excel Upload

1. Go to "Import Data" tab
2. Click "Download Sample Format" button
3. Open the downloaded Excel file (has 3 sample customers)
4. Add your customers or modify the samples
5. Make sure you have columns: **name**, **email** (required), phone, location, joinDate (optional)
6. Save the file as .xlsx
7. Click the upload area and select your file
8. Wait for success message
9. Check "Manage Customers" tab to see imported customers

### Excel File Format

Your Excel file must have these columns (first row):

| name | email | phone | location | joinDate |
|------|-------|-------|----------|----------|
| Rajesh Kumar | rajesh@example.com | 9876543210 | Mumbai | 2024-01-15 |
| Priya Sharma | priya@example.com | 9876543211 | Delhi | 2024-02-20 |

**Required:** name, email  
**Optional:** phone, location, joinDate

## Troubleshooting Excel Upload

### File Not Uploading?
- ✅ Use .xlsx or .xls format only
- ✅ First row must be headers (name, email, etc.)
- ✅ Make sure server is running on port 5000
- ✅ Check browser console for errors (F12)

### "No file uploaded" Error?
- File input may not be working
- Try refreshing the page
- Make sure you selected a file

### "Failed to process Excel file" Error?
- Download and use the sample format
- Make sure columns are named correctly (lowercase: name, email)
- Don't have empty rows at the top
- Save as Excel Workbook (.xlsx), not CSV

### Duplicate Email Error?
- Each email can only exist once
- Remove duplicate emails from your Excel file
- Or delete existing customer first

## Features

### Dynamic Predictions
- No pre-loaded data
- Predictions based on actual purchase history
- Updates automatically when purchases are recorded

### Customer Management
- Add customers manually
- Import from Excel
- View and delete customers
- Track purchase history

### Purchase Tracking
- Record customer purchases
- Automatic prediction updates
- Category-based analysis

### Smart Filters
- Filter by risk level (High/Medium/Low)
- Filter by buy probability (High/Medium/Low)
- Find high-priority opportunities

## Project Structure

```
patel-electronics-analytics/
├── server/
│   ├── server.js
│   ├── routes/data.js
│   └── controllers/dataController.js
└── client/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── App.css
        └── index.js
```

## API Endpoints

- `POST /api/data/upload-excel` - Upload Excel file
- `GET /api/data/sample-format` - Download sample format
- `POST /api/data/customers` - Add customer
- `GET /api/data/customers` - Get all customers
- `DELETE /api/data/customers/:id` - Delete customer
- `POST /api/data/purchases` - Record purchase
- `GET /api/data/predictions/:customerId` - Get predictions

## Technologies

- **Backend:** Node.js, Express, Multer, XLSX, MySQL2
- **Frontend:** React 18, Axios
- **Storage:** In-memory (data resets on server restart)

## Support

If Excel upload still doesn't work:

1. **Check server logs:**
   - Look at the terminal where server is running
   - Should see "✅ Server is running on port 5000"

2. **Check browser console:**
   - Press F12 in browser
   - Look for errors in Console tab

3. **Restart both server and client:**
   - Stop both (Ctrl+C)
   - Start server first, then client

4. **Try the sample format:**
   - Always download and use the sample format first
   - Add your data to the sample file

## Version 2.0 - Fixed Release

✅ Excel upload fully working  
✅ Better validation and error messages  
✅ Loading states and user feedback  
✅ Comprehensive sample format  
✅ Detailed troubleshooting guide  

---

**Developed for Patel Electronics**
>>>>>>> dac61e2 (Adding React and Node)
