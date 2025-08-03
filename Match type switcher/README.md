# Keyword Match Type Converter - Implementation

This is a standalone single-page website that converts keywords between different match types (broad, phrase, exact) according to the specifications in the main README.

## Features

### Core Functionality
- **Input Processing**: Accepts keywords separated by commas or newlines
- **Match Type Detection**: Automatically detects current match type from input format
- **Conversion**: Converts keywords to any target match type
- **Validation**: Validates keywords against invalid characters and format rules
- **Deduplication**: Removes duplicate keywords from output
- **Statistics**: Shows count of keywords, duplicates removed, and invalid keywords

### Match Type Support
- **Broad Match**: No special formatting (e.g., `keyword`)
- **Phrase Match**: Surrounded by double quotes (e.g., `"keyword"`)
- **Exact Match**: Surrounded by square brackets (e.g., `[keyword]`)

### Validation Rules
- Checks for invalid characters: ``! @ % , ( ) = { } ; ~ ` < > ? \ |``
- Validates that keywords don't contain match type signifiers internally
- Handles the `(broad)` notation that search engines sometimes add
- Treats dashes as spaces (equivalent to spaces)

### User Interface
- **Modern Design**: Clean, responsive interface with gradient background
- **Visual Feedback**: Color-coded buttons for different match types
- **Real-time Validation**: Shows validation results for each keyword
- **Copy to Clipboard**: One-click copying of converted keywords
- **Statistics Display**: Shows processing results
- **Mobile Responsive**: Works on desktop and mobile devices

## File Structure

```
Match type switcher/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Usage

1. Open `index.html` in a web browser
2. Enter keywords in the input field (can be mixed match types)
3. Click one of the conversion buttons (Broad, Phrase, or Exact)
4. View converted keywords in the output field
5. Check validation results for any issues
6. Copy results to clipboard or clear to start over

## Technical Implementation

### JavaScript Class Structure
The `KeywordConverter` class handles all functionality:
- **Parsing**: Splits input by commas and newlines
- **Detection**: Identifies current match type from formatting
- **Conversion**: Applies target match type formatting
- **Validation**: Checks for invalid characters and formats
- **Deduplication**: Uses Set to remove duplicates
- **UI Updates**: Manages all DOM interactions

### CSS Features
- Flexbox layout for responsive design
- CSS Grid for button arrangements
- Smooth transitions and hover effects
- Color-coded validation states
- Mobile-first responsive breakpoints

### Browser Compatibility
- Modern browsers with ES6+ support
- Fallback clipboard functionality for older browsers
- Progressive enhancement approach

## Example Usage

**Input:**
```
[exact keyword]
"phrase keyword"
broad keyword
keyword (broad)
```

**Output (converted to phrase match):**
```
"broad keyword"
"exact keyword"
"keyword"
"phrase keyword"
```

The converter will:
- Detect the original match types
- Convert all to phrase match format
- Remove duplicates (if any)
- Validate for invalid characters
- Sort alphabetically
- Show validation results for each input keyword 