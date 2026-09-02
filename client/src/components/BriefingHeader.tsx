import React from 'react';
import { RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface BriefingHeaderProps {
  explicitTopics: string[];
  freeTextInterests: string[];
  marketRegion: 'global' | 'india';
  lastRefreshed: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRegionChange: (region: 'global' | 'india') => void;
  onResetPersonalization: () => void;
  onEditPreferences: () => void;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({
  explicitTopics,
  freeTextInterests,
  marketRegion,
  lastRefreshed,
  isRefreshing,
  onRefresh,
  onRegionChange,
  onResetPersonalization,
  onEditPreferences,
}) => {
  const allInterests = [...explicitTopics, ...freeTextInterests];

  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="briefing-header">
      <div className="header-top">
        <div>
          <h1 className="brand-title">My5</h1>
          <p className="brand-tagline">Five stories worth your attention this week.</p>
        </div>

        <div className="header-actions">
          {/* Market Region Selector */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{
                border: 'none',
                background: marketRegion === 'global' ? 'var(--border-color-light)' : 'transparent',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem'
              }}
              onClick={() => onRegionChange('global')}
            >
              🌍 Global
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{
                border: 'none',
                background: marketRegion === 'india' ? 'var(--border-color-light)' : 'transparent',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem'
              }}
              onClick={() => onRegionChange('india')}
            >
              🇮🇳 India Focus
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh My5'}
          </button>

          <button
            className="btn-secondary"
            onClick={onEditPreferences}
          >
            <SlidersHorizontal size={14} /> Edit Interests
          </button>

          <button
            className="btn-text-danger"
            onClick={onResetPersonalization}
            title="Reset adaptive topic weights and feedback history"
          >
            <RotateCcw size={13} /> Reset Personalization
          </button>
        </div>
      </div>

      <div className="interest-meta-bar">
        <div>
          <span className="meta-label">Personalized for: </span>
          <div className="active-chips" style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
            {allInterests.map(interest => (
              <span key={interest} className="active-chip">
                {interest}
              </span>
            ))}
          </div>
        </div>

        {formattedTime && (
          <span className="timestamp-text">
            Last refreshed: {formattedTime}
          </span>
        )}
      </div>
    </header>
  );
};
