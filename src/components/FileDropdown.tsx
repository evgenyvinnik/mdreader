import { useState, useRef, useEffect, type JSX } from 'react';
import type { Document } from '../storage/indexedDb';

interface FileDropdownProps {
  readonly documents: Document[];
  readonly currentDocId: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function FileDropdown({
  documents,
  currentDocId,
  onSelect,
  onDelete,
}: FileDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string): void => {
    onSelect(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      onDelete(id);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentDoc = documents.find((d) => d.id === currentDocId);

  return (
    <div className="file-dropdown" ref={dropdownRef}>
      <button
        className="file-dropdown-trigger"
        onClick={() => { setIsOpen(!isOpen); }}
        title="Select document"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="file-dropdown-current">
          {currentDoc?.title ?? 'Select file'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="file-dropdown-menu">
          <div className="file-dropdown-search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              className="file-dropdown-search-input"
            />
          </div>
          <div className="file-dropdown-list">
            {filteredDocuments.length === 0 ? (
              <div className="file-dropdown-empty">No files found</div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`file-dropdown-item ${doc.id === currentDocId ? 'active' : ''}`}
                  onClick={() => { handleSelect(doc.id); }}
                >
                  <div className="file-dropdown-item-content">
                    <span className="file-dropdown-item-title">{doc.title}</span>
                    <span className="file-dropdown-item-date">
                      {formatDate(doc.updatedAt)}
                    </span>
                  </div>
                  <button
                    className="file-dropdown-delete"
                    onClick={(e) => { handleDelete(e, doc.id); }}
                    title="Delete document"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
