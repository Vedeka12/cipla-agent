import React, { useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';

const PREDEFINED_TOPICS = [
  'Marketing',
  'Consulting',
  'Product Management',
  'AI',
  'Technology',
  'Startups',
  'Finance',
  'Consumer',
  'Automotive',
  'Semiconductors',
  'Healthcare',
  'Strategy',
  'Economy'
];

interface OnboardingProps {
  initialExplicit: string[];
  initialFreeText: string[];
  onComplete: (explicit: string[], freeText: string[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  initialExplicit,
  initialFreeText,
  onComplete
}) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialExplicit);
  const [freeTextList, setFreeTextList] = useState<string[]>(initialFreeText);
  const [customInput, setCustomInput] = useState('');

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !freeTextList.includes(trimmed)) {
      setFreeTextList([...freeTextList, trimmed]);
      setCustomInput('');
    }
  };

  const removeCustom = (item: string) => {
    setFreeTextList(freeTextList.filter(i => i !== item));
  };

  const isFormValid = selectedTopics.length > 0 || freeTextList.length > 0;

  const handleSubmit = () => {
    if (isFormValid) {
      onComplete(selectedTopics, freeTextList);
    }
  };

  return (
    <div className="onboarding-container">
      <h1 className="onboarding-title">What do you want to stay updated on?</h1>
      <p className="onboarding-subtitle">
        Select topics or add specific micro-interests to generate your weekly My5 briefing.
      </p>

      <div className="chips-grid">
        {PREDEFINED_TOPICS.map(topic => {
          const isSelected = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              className={`chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </button>
          );
        })}
      </div>

      <div className="custom-interest-group">
        <label className="input-label" htmlFor="custom-interest">
          Add anything else you're interested in
        </label>
        <form onSubmit={handleAddCustom} className="custom-input-row">
          <input
            id="custom-interest"
            type="text"
            className="text-input"
            placeholder="e.g. FMCG marketing, AI agents, Indian automotive industry..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
          />
          <button
            type="submit"
            className="btn-secondary"
            disabled={!customInput.trim()}
          >
            <Plus size={16} /> Add
          </button>
        </form>

        {freeTextList.length > 0 && (
          <div className="custom-tag-list">
            {freeTextList.map(item => (
              <span key={item} className="custom-tag">
                {item}
                <button
                  type="button"
                  className="remove-tag-btn"
                  onClick={() => removeCustom(item)}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!isFormValid}
        onClick={handleSubmit}
      >
        Generate My5 Briefing <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.25rem' }} />
      </button>
    </div>
  );
};
