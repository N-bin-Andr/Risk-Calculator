import React from 'react';

interface ExportActionsProps {
  templateName: string;
  note: string;
  tags: string[];
  onTemplateNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSaveTemplate: () => void;
  onExportToImage: () => void;
  onExportToNotion: () => void;
  disabled?: boolean;
  hasResults?: boolean;
}

const ExportActions: React.FC<ExportActionsProps> = ({
  templateName,
  note,
  tags,
  onTemplateNameChange,
  onNoteChange,
  onAddTag,
  onRemoveTag,
  onSaveTemplate,
  onExportToImage,
  onExportToNotion,
  disabled = false,
  hasResults = false
}) => {
  const [newTag, setNewTag] = React.useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ marginBottom: '15px' }}>
        <label>
          Название шаблона:
          <input
            type="text"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            disabled={disabled}
            placeholder="Мой шаблон расчета"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Заметка:
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Дополнительные заметки..."
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            disabled={disabled}
            placeholder="Новый тег"
            style={{ flex: 1, padding: '8px' }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={disabled}
            style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Добавить
          </button>
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  disabled={disabled}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f44336',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: 0
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSaveTemplate}
          disabled={disabled || !templateName.trim()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled || !templateName.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Сохранить шаблон
        </button>

        <button
          type="button"
          onClick={onExportToImage}
          disabled={disabled || !hasResults}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled || !hasResults ? 'not-allowed' : 'pointer'
          }}
        >
          Экспорт в изображение
        </button>

        <button
          type="button"
          onClick={onExportToNotion}
          disabled={disabled || !hasResults}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled || !hasResults ? 'not-allowed' : 'pointer'
          }}
        >
          Отправить в Notion
        </button>
      </div>
    </div>
  );
};

export default ExportActions;
