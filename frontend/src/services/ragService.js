import api from "./api";

export const ragService = {
  async query(queryText, topK = 5, sessionId = null, selectedDocuments = []) {
    try {
      let url = '/rag/query';
      const params = new URLSearchParams();
      
      if (sessionId) {
        params.append('session_id', sessionId);
      }
      
      if (selectedDocuments && selectedDocuments.length > 0) {
        selectedDocuments.forEach(doc => params.append('documents', doc));
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('RAG Query:', {
        url,
        body: { query: queryText, top_k: topK },
        params: params.toString()
      });
      
      const response = await api.post(url, {
        query: queryText,
        top_k: topK,
      });
      
      console.log('RAG Response:', response);
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in ragService.query:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  async indexDocument(document) {
    const response = await api.post("/rag/index", document);
    return response.data;
  },

  async exportToPDF(data) {
    const response = await api.post("/export/pdf", data, {
      responseType: "blob", // Important for file download
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = "rag_response.pdf";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },
};
