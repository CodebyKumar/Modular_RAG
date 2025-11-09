# Document Selection Feature - Fix Documentation

## Problem
The document selection feature while chatting is not working. Users should be able to:
1. Select specific documents from the sidebar
2. Chat only uses those selected documents as sources
3. Show warning if no documents are selected

## Changes Made

### 1. Frontend - ChatInterface.jsx

**Added Document Selection Validation:**
```javascript
// Check if documents are selected before sending query
if (!selectedDocuments || selectedDocuments.length === 0) {
  showToast({
    type: "warning",
    message: "Please select at least one document from the sidebar to chat with",
  });
  return;
}
```

**Added Visual Indicators:**
- Blue info box when no documents selected (reminds user to select)
- Green badge showing count when documents are selected
- Better empty state messaging

### 2. Backend - routes/rag.py

**Fixed Query Parameter Handling:**
```python
from fastapi import Query
from typing import List, Optional

async def query_documents(
    query_request: QueryRequest,
    session_id: Optional[str] = None,
    documents: Optional[List[str]] = Query(None),  # Proper FastAPI query param
    current_user: Dict[str, Any] = Depends(get_current_user)
):
```

**Why this fix:**
- `Query(None)` tells FastAPI to accept multiple `documents` query parameters
- Allows URLs like: `/rag/query?documents=file1.pdf&documents=file2.pdf`

### 3. Backend - controller/rag_controller.py

**Added Logging:**
```python
logger.info(f"User '{username}' submitted query: '{query}'")
logger.info(f"Document filter: {documents} (type: {type(documents)})")

if documents:
    logger.info(f"Filtering to {len(documents)} documents: {documents}")
```

**Added Type Hints:**
- Changed `list[str]` to `List[str]` for compatibility
- Added `Optional` wrapper

### 4. Backend - service/pinecone_service.py

**Enhanced Document Filtering:**
```python
# Filter by documents if provided
if documents and len(documents) > 0:
    source_filename = metadata.get('source_filename')
    if source_filename not in documents:
        logger.debug(f"Filtering out chunk from {source_filename}, not in {documents}")
        continue
```

**Improvements:**
- Explicit length check
- Better logging for debugging
- Clear filtering logic

### 5. Frontend - services/ragService.js

**Added Debug Logging:**
```javascript
console.log('RAG Query:', {
  url,
  body: { query: queryText, top_k: topK },
  params: params.toString()
});
```

## How It Works

### Flow:
1. **User selects documents** in DocumentSelector (sidebar)
2. **Selection stored** in ChatPage state
3. **Passed to ChatInterface** as prop
4. **Validated before query** - shows warning if empty
5. **Sent to backend** as query parameters
6. **Backend filters** vector search by source_filename
7. **Only matching chunks** returned
8. **Answer generated** from filtered sources

### URL Example:
```
POST /rag/query?session_id=abc123&documents=file1.pdf&documents=file2.pdf
Body: { "query": "What is...", "top_k": 5 }
```

## Testing Checklist

### Frontend:
- [ ] Select 0 documents → Warning toast appears
- [ ] Select 1 document → Query works, uses only that document
- [ ] Select multiple documents → Query works, uses all selected
- [ ] Empty state shows blue info box when no docs selected
- [ ] Empty state shows green badge when docs selected
- [ ] Console logs show selected documents

### Backend:
- [ ] Logs show document filter being applied
- [ ] Logs show chunks being filtered
- [ ] Response only contains sources from selected documents
- [ ] Works with 1 document
- [ ] Works with multiple documents
- [ ] Works without document filter (all documents)

### Integration:
- [ ] Document selection persists during chat
- [ ] Can change selection between queries
- [ ] Sources in response match selected documents
- [ ] No sources from unselected documents appear

## Debugging

### Check Frontend Console:
```javascript
// Should see:
Sending message: {
  query: "...",
  sessionId: "...",
  selectedDocuments: ["file1.pdf", "file2.pdf"]
}

RAG Query: {
  url: "/rag/query?session_id=...&documents=file1.pdf&documents=file2.pdf",
  body: { query: "...", top_k: 5 },
  params: "session_id=...&documents=file1.pdf&documents=file2.pdf"
}
```

### Check Backend Logs:
```
INFO: User 'username' submitted query: '...'
INFO: Document filter: ['file1.pdf', 'file2.pdf'] (type: <class 'list'>)
INFO: Filtering to 2 documents: ['file1.pdf', 'file2.pdf']
DEBUG: Filtering out chunk from file3.pdf, not in ['file1.pdf', 'file2.pdf']
```

### Common Issues:

1. **Documents not filtering:**
   - Check metadata has `source_filename` field
   - Verify filename matches exactly (case-sensitive)
   - Check backend logs for filter being applied

2. **Warning always shows:**
   - Check selectedDocuments prop is passed correctly
   - Verify DocumentSelector is updating state
   - Check console for selectedDocuments value

3. **Empty results:**
   - Selected documents might not have relevant content
   - Try selecting more documents
   - Check if documents are actually indexed

## Future Improvements

1. **Show selected documents in chat header**
2. **Allow changing selection without clearing chat**
3. **Show which document each source came from**
4. **Add "Select All" / "Clear All" quick actions**
5. **Remember selection per session**
6. **Show document count in query input area**
