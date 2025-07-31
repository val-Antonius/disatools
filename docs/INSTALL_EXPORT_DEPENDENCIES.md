# 📦 Install Export Dependencies

## 🎯 Required Dependencies

Untuk mengaktifkan fitur export PDF dan Excel yang telah diimplementasi, install dependencies berikut:

## 🚀 Installation Commands

### Install All Dependencies:
```bash
npm install jspdf jspdf-autotable xlsx
```

### Or Install Individually:
```bash
# For PDF export
npm install jspdf jspdf-autotable

# For Excel export  
npm install xlsx
```

### With Yarn:
```bash
yarn add jspdf jspdf-autotable xlsx
```

## 📋 Dependencies Details

### 1. **jsPDF** (v2.5.1+)
- **Purpose**: PDF generation
- **Usage**: Create PDF documents with text, tables, styling
- **Size**: ~200KB minified

### 2. **jsPDF-AutoTable** (v3.6.0+)
- **Purpose**: Table generation for PDF
- **Usage**: Create formatted tables in PDF documents
- **Size**: ~50KB minified

### 3. **xlsx** (v0.18.5+)
- **Purpose**: Excel file generation and parsing
- **Usage**: Create .xlsx files with multiple sheets
- **Size**: ~600KB minified

## 🔧 Verification

After installation, verify dependencies are installed:

```bash
# Check package.json
cat package.json | grep -E "(jspdf|xlsx)"

# Or check node_modules
ls node_modules | grep -E "(jspdf|xlsx)"
```

Expected output:
```
jspdf
jspdf-autotable
xlsx
```

## 🎯 Testing Installation

Test the export functionality:

1. **Go to Reports page**: `http://localhost:3000/reports`
2. **Click "Download PDF"**: Should generate and download PDF
3. **Click "Download Excel"**: Should generate and download Excel
4. **Check browser downloads**: Files should be properly formatted

## 🐛 Troubleshooting

### Common Issues:

#### 1. **Module Not Found Error**
```
Error: Cannot resolve module 'jspdf'
```
**Solution**: 
```bash
npm install jspdf jspdf-autotable xlsx
npm run dev
```

#### 2. **Dynamic Import Error**
```
Error: Dynamic import is not supported
```
**Solution**: Already handled with dynamic imports in code

#### 3. **PDF Generation Error**
```
Error: jsPDF is not a constructor
```
**Solution**: Check import syntax in `exportUtils.ts`

#### 4. **Excel Generation Error**
```
Error: XLSX.utils is undefined
```
**Solution**: Ensure xlsx is properly installed

### 5. **File Not Downloading**
- Check browser download settings
- Ensure popup blocker is disabled
- Check browser console for errors

## 📊 File Sizes Impact

### Bundle Size Impact:
- **jsPDF**: ~200KB
- **jsPDF-AutoTable**: ~50KB  
- **xlsx**: ~600KB
- **Total**: ~850KB additional bundle size

### Optimization:
- Libraries are dynamically imported (code splitting)
- Only loaded when export function is called
- No impact on initial page load

## 🔄 Alternative Solutions

If bundle size is a concern, consider:

### 1. **Server-side Generation**
- Move PDF/Excel generation to API routes
- Use Node.js libraries on server
- Smaller client bundle

### 2. **External Service**
- Use services like PDFShift, HTML/CSS to PDF API
- Reduce client-side dependencies
- May have cost implications

### 3. **Lazy Loading**
- Current implementation already uses dynamic imports
- Libraries only loaded when needed

## ✅ Success Indicators

After successful installation and testing:

- [ ] Dependencies installed in package.json
- [ ] PDF export generates proper PDF files
- [ ] Excel export generates proper .xlsx files
- [ ] Files open correctly in respective applications
- [ ] No console errors during export
- [ ] Professional formatting in generated files

## 🎉 Ready to Use!

Once dependencies are installed, the Calendar-Reports integration is fully functional with:

- ✅ Real PDF generation with professional layout
- ✅ Real Excel generation with multiple sheets
- ✅ Seamless Calendar to Reports navigation
- ✅ Pre-filled date filters
- ✅ Error handling and user feedback

**Enjoy the enhanced reporting capabilities!** 📊🚀
