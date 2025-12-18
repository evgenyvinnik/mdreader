import { useState, useRef, useEffect, type JSX } from 'react';
import type { Document } from '../storage/indexedDb';
import { DocumentIcon, ChevronDownIcon, SearchIcon, EditIcon, TrashIcon } from './Icons';
import { isMobileDevice } from '../utils/AppUtils';

interface FileDropdownProps {
  readonly documents: Document[];
  readonly currentDocId: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onRename: (id: string, newTitle: string) => void;
}

export function FileDropdown({
  documents,
  currentDocId,
  onSelect,
  onDelete,
  onRename,
}: FileDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMobile] = useState(isMobileDevice);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setEditingId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !editingId) {
      searchInputRef.current.focus();
    }
  }, [isOpen, editingId]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

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

  const handleEditStart = (e: React.MouseEvent, doc: Document): void => {
    e.stopPropagation();
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const handleEditSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      handleEditCancel();
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

  const closeDropdown = (): void => {
    setIsOpen(false);
    setSearchQuery('');
    setEditingId(null);
  };

  return (
    <div className={`file-dropdown ${isMobile ? 'is-mobile' : ''}`} ref={dropdownRef}>
      <button
        className="file-dropdown-trigger"
        onClick={() => { setIsOpen(!isOpen); }}
        title="Select document"
      >
        <DocumentIcon size={16} />
        <span className="file-dropdown-current">
          {currentDoc?.title ?? 'Select file'}
        </span>
        <ChevronDownIcon size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div 
              className="file-dropdown-backdrop" 
              onClick={closeDropdown}
              onTouchStart={closeDropdown}
            />
          )}
          <div className="file-dropdown-menu">
            <div className="file-dropdown-search">
              <SearchIcon size={14} />
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
                    onClick={() => { if (!editingId) handleSelect(doc.id); }}
                  >
                    <div className="file-dropdown-item-content">
                      {editingId === doc.id ? (
                        <form onSubmit={handleEditSave} className="file-dropdown-edit-form">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => { setEditingTitle(e.target.value); }}
                            onKeyDown={handleEditKeyDown}
                            onBlur={handleEditSave}
                            className="file-dropdown-edit-input"
                            onClick={(e) => { e.stopPropagation(); }}
                          />
                        </form>
                      ) : (
                        <>
                          <span className="file-dropdown-item-title">{doc.title}</span>
                          <span className="file-dropdown-item-date">
                            {formatDate(doc.updatedAt)}
                          </span>
                        </>
                      )}
                    </div>
                    {editingId !== doc.id && (
                      <div className="file-dropdown-actions">
                        <button
                          className="file-dropdown-edit"
                          onClick={(e) => { handleEditStart(e, doc); }}
                          title="Rename document"
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          className="file-dropdown-delete"
                          onClick={(e) => { handleDelete(e, doc.id); }}
                          title="Delete document"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
