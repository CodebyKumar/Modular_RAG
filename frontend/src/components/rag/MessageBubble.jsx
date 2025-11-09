import { useState } from "react";
import { SourceCard } from "./SourceCard";
import { ragService } from "../../services/ragService";
import { useToast } from "../../hooks/useToast";

// Helper function to remove Markdown formatting
function stripMarkdown(text) {
  if (!text) return "";

  let cleaned = text;

  // Remove bold formatting (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "$1");
  cleaned = cleaned.replace(/__(.+?)__/g, "$1");

  // Remove italic formatting (*text* or _text_)
  cleaned = cleaned.replace(/\*(.+?)\*/g, "$1");
  cleaned = cleaned.replace(/_(.+?)_/g, "$1");

  // Remove headers (# or ## or ### etc.)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // Remove inline code (`code`)
  cleaned = cleaned.replace(/`(.+?)`/g, "$1");

  // Remove code blocks (```code```)
  cleaned = cleaned.replace(/```[a-z]*\n(.+?)\n```/gs, "$1");

  return cleaned.trim();
}

export function MessageBubble({ type, content, sources = [], query = "" }) {
  const [showSources, setShowSources] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  // Safety check for content
  if (!content) {
    console.warn("MessageBubble received empty content");
    return null;
  }

  // Clean the content from any Markdown formatting
  const cleanContent = stripMarkdown(content);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setIsCopied(true);
      showToast({ type: "success", message: "Text copied to clipboard!" });

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      showToast({
        type: "error",
        message: "Failed to copy text. Please try again.",
      });
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await ragService.exportToPDF({
        query: query,
        answer: cleanContent,
        sources: sources || [],
      });
      showToast({ type: "success", message: "PDF exported successfully!" });
    } catch (error) {
      showToast({
        type: "error",
        message:
          error.response?.data?.detail ||
          "Failed to export PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (type === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gray-100 rounded-lg px-4 py-2.5 max-w-2xl">
          <p className="text-gray-900 text-sm leading-relaxed">
            {cleanContent}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white rounded-lg px-4 py-3 border border-gray-100">
        <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
          {cleanContent}
        </p>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          {/* Left side - Copy button and Sources */}
          <div className="flex items-center gap-3">
            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              title="Copy text"
            >
              {isCopied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Sources Button */}
            {sources && sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {sources.length} source{sources.length > 1 ? "s" : ""}
                <svg
                  className={`w-3 h-3 transition-transform ${
                    showSources ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Right side - Export PDF Button */}
          <div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to PDF"
            >
              {isExporting ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showSources && sources && sources.length > 0 && (
        <div className="space-y-2 ml-4">
          {sources.map((source, index) => (
            <SourceCard key={source.id || index} {...source} />
          ))}
        </div>
      )}
    </div>
  );
}
