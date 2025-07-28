import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './MetadataEditor.css';

interface MetadataEditorProps {
  initialMetadata?: {
    tags: string[];
    description: string;
    rating: number;
  };
  availableTags: string[];
  onSave: (metadata: { tags: string[]; description: string; rating: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
  initialMetadata,
  availableTags,
  onSave,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  
  const [tags, setTags] = useState<string[]>(initialMetadata?.tags || []);
  const [description, setDescription] = useState(initialMetadata?.description || '');
  const [rating, setRating] = useState(initialMetadata?.rating || 0);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Filter tag suggestions based on input
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !tags.includes(tag)
      );
      setFilteredSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [tagInput, availableTags, tags]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  }, [tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleAddTag(filteredSuggestions[0]);
      } else if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  }, [tagInput, filteredSuggestions, tags, handleAddTag, handleRemoveTag]);

  const handleRatingClick = useCallback((newRating: number) => {
    setRating(newRating === rating ? 0 : newRating);
  }, [rating]);

  const handleSave = useCallback(() => {
    onSave({
      tags,
      description: description.trim(),
      rating,
    });
  }, [tags, description, rating, onSave]);

  const hasChanges = useCallback(() => {
    const initial = initialMetadata || { tags: [], description: '', rating: 0 };
    return (
      JSON.stringify(tags.sort()) !== JSON.stringify(initial.tags.sort()) ||
      description.trim() !== initial.description ||
      rating !== initial.rating
    );
  }, [tags, description, rating, initialMetadata]);

  return (
    <div className="metadata-editor">
      <div className="editor-section">
        <label className="editor-label">
          <i className="pi pi-tags"></i>
          {t('metadataEditor.tags')}
        </label>
        <div className="tags-input-container">
          <div className="tags-display">
            {tags.map((tag, index) => (
              <span key={index} className="tag-chip">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={t('metadataEditor.removeTag', { tag })}
                >
                  <i className="pi pi-times"></i>
                </button>
              </span>
            ))}
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => tagInput && setShowTagSuggestions(filteredSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder={t('metadataEditor.addTag')}
              disabled={loading}
            />
          </div>
          {showTagSuggestions && (
            <div className="tag-suggestions">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="tag-suggestion"
                  onClick={() => handleAddTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label" htmlFor="description-input">
          <i className="pi pi-file-text"></i>
          {t('metadataEditor.description')}
        </label>
        <textarea
          id="description-input"
          className="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('metadataEditor.descriptionPlaceholder')}
          rows={4}
          disabled={loading}
        />
      </div>

      <div className="editor-section">
        <label className="editor-label">
          <i className="pi pi-star"></i>
          {t('metadataEditor.rating')}
        </label>
        <div className="rating-input">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              className={`rating-star ${star <= rating ? 'filled' : ''}`}
              onClick={() => handleRatingClick(star)}
              disabled={loading}
              aria-label={t('metadataEditor.ratingStar', { star })}
            >
              <i className="pi pi-star"></i>
            </button>
          ))}
          {rating > 0 && (
            <button
              type="button"
              className="rating-clear"
              onClick={() => setRating(0)}
              disabled={loading}
              aria-label={t('metadataEditor.clearRating')}
            >
              <i className="pi pi-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="editor-actions">
        <button
          type="button"
          className="action-button secondary"
          onClick={onCancel}
          disabled={loading}
        >
          <i className="pi pi-times"></i>
          {t('metadataEditor.cancel')}
        </button>
        <button
          type="button"
          className="action-button primary"
          onClick={handleSave}
          disabled={loading || !hasChanges()}
        >
          {loading ? (
            <i className="pi pi-spin pi-spinner"></i>
          ) : (
            <i className="pi pi-check"></i>
          )}
          {t('metadataEditor.save')}
        </button>
      </div>
    </div>
  );
};

export default MetadataEditor;