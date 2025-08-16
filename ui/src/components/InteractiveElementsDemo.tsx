import React, { useState } from 'react';
import './InteractiveElementsDemo.css';

interface InteractiveElementsDemoProps {
  className?: string;
}

export const InteractiveElementsDemo: React.FC<InteractiveElementsDemoProps> = ({ 
  className = '' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [toggleValue, setToggleValue] = useState(false);
  const [selectValue, setSelectValue] = useState('option1');
  const [inputValue, setInputValue] = useState('');
  const [progressValue] = useState(65);

  return (
    <div className={`interactive-elements-demo ${className}`}>
      <h2 className="demo-title">Interactive Elements Demo</h2>
      
      {/* Button Variants */}
      <section className="demo-section">
        <h3 className="demo-section-title">Buttons</h3>
        <div className="demo-grid">
          <div className="demo-group">
            <h4>Button Variants</h4>
            <div className="demo-buttons">
              <button className="asset-manager-button">Default</button>
              <button className="asset-manager-button asset-manager-button--primary">Primary</button>
              <button className="asset-manager-button asset-manager-button--secondary">Secondary</button>
              <button className="asset-manager-button asset-manager-button--success">Success</button>
              <button className="asset-manager-button asset-manager-button--warning">Warning</button>
              <button className="asset-manager-button asset-manager-button--error">Error</button>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Button Sizes</h4>
            <div className="demo-buttons">
              <button className="asset-manager-button asset-manager-button--small">Small</button>
              <button className="asset-manager-button">Medium</button>
              <button className="asset-manager-button asset-manager-button--large">Large</button>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Button States</h4>
            <div className="demo-buttons">
              <button className="asset-manager-button asset-manager-button--loading">Loading</button>
              <button className="asset-manager-button" disabled>Disabled</button>
              <button className="asset-manager-button asset-manager-button--icon">🔍</button>
              <button className="asset-manager-button asset-manager-button--icon asset-manager-button--icon-small">⚙️</button>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Button Group</h4>
            <div className="asset-manager-button-group">
              <button className="asset-manager-button">Left</button>
              <button className="asset-manager-button">Center</button>
              <button className="asset-manager-button">Right</button>
            </div>
          </div>
        </div>
      </section>

      {/* Input Elements */}
      <section className="demo-section">
        <h3 className="demo-section-title">Input Elements</h3>
        <div className="demo-grid">
          <div className="demo-group">
            <h4>Text Inputs</h4>
            <div className="demo-inputs">
              <input 
                type="text" 
                className="asset-manager-input" 
                placeholder="Default input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <input 
                type="text" 
                className="asset-manager-input asset-manager-input--small" 
                placeholder="Small input"
              />
              <input 
                type="text" 
                className="asset-manager-input asset-manager-input--large" 
                placeholder="Large input"
              />
              <input 
                type="text" 
                className="asset-manager-input asset-manager-input--error" 
                placeholder="Error state"
              />
              <input 
                type="text" 
                className="asset-manager-input asset-manager-input--success" 
                placeholder="Success state"
              />
              <input 
                type="text" 
                className="asset-manager-input" 
                placeholder="Disabled input"
                disabled
              />
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Select Dropdown</h4>
            <select 
              className="asset-manager-select"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            >
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
            <select className="asset-manager-select" disabled>
              <option>Disabled Select</option>
            </select>
          </div>
          
          <div className="demo-group">
            <h4>Input Group</h4>
            <div className="asset-manager-input-group">
              <input type="text" className="asset-manager-input" placeholder="Search..." />
              <button className="asset-manager-button asset-manager-button--primary">🔍</button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Controls */}
      <section className="demo-section">
        <h3 className="demo-section-title">Form Controls</h3>
        <div className="demo-grid">
          <div className="demo-group">
            <h4>Checkboxes</h4>
            <div className="demo-form-controls">
              <label className="asset-manager-checkbox">
                <input 
                  type="checkbox" 
                  checked={checkboxValue}
                  onChange={(e) => setCheckboxValue(e.target.checked)}
                />
                <span className="asset-manager-checkbox-indicator"></span>
                Checkbox Label
              </label>
              <label className="asset-manager-checkbox">
                <input type="checkbox" defaultChecked />
                <span className="asset-manager-checkbox-indicator"></span>
                Checked by default
              </label>
              <label className="asset-manager-checkbox">
                <input type="checkbox" disabled />
                <span className="asset-manager-checkbox-indicator"></span>
                Disabled checkbox
              </label>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Radio Buttons</h4>
            <div className="demo-form-controls">
              <label className="asset-manager-radio">
                <input 
                  type="radio" 
                  name="demo-radio" 
                  value="option1"
                  checked={radioValue === 'option1'}
                  onChange={(e) => setRadioValue(e.target.value)}
                />
                <span className="asset-manager-radio-indicator"></span>
                Option 1
              </label>
              <label className="asset-manager-radio">
                <input 
                  type="radio" 
                  name="demo-radio" 
                  value="option2"
                  checked={radioValue === 'option2'}
                  onChange={(e) => setRadioValue(e.target.value)}
                />
                <span className="asset-manager-radio-indicator"></span>
                Option 2
              </label>
              <label className="asset-manager-radio">
                <input type="radio" name="disabled-radio" disabled />
                <span className="asset-manager-radio-indicator"></span>
                Disabled option
              </label>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Toggle Switches</h4>
            <div className="demo-form-controls">
              <label className="asset-manager-toggle">
                <input 
                  type="checkbox"
                  checked={toggleValue}
                  onChange={(e) => setToggleValue(e.target.checked)}
                />
                <span className="asset-manager-toggle-track">
                  <span className="asset-manager-toggle-thumb"></span>
                </span>
                <span style={{ marginLeft: '0.5rem' }}>Toggle me</span>
              </label>
              <label className="asset-manager-toggle">
                <input type="checkbox" defaultChecked />
                <span className="asset-manager-toggle-track">
                  <span className="asset-manager-toggle-thumb"></span>
                </span>
                <span style={{ marginLeft: '0.5rem' }}>On by default</span>
              </label>
              <label className="asset-manager-toggle">
                <input type="checkbox" disabled />
                <span className="asset-manager-toggle-track">
                  <span className="asset-manager-toggle-thumb"></span>
                </span>
                <span style={{ marginLeft: '0.5rem' }}>Disabled toggle</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Components */}
      <section className="demo-section">
        <h3 className="demo-section-title">Interactive Components</h3>
        <div className="demo-grid">
          <div className="demo-group">
            <h4>Modal Dialog</h4>
            <button 
              className="asset-manager-button asset-manager-button--primary"
              onClick={() => setIsModalOpen(true)}
            >
              Open Modal
            </button>
          </div>
          
          <div className="demo-group">
            <h4>Dropdown Menu</h4>
            <div className={`asset-manager-dropdown ${isDropdownOpen ? 'asset-manager-dropdown--open' : ''}`}>
              <button 
                className="asset-manager-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                Dropdown ▼
              </button>
              <div className="asset-manager-dropdown-menu">
                <button className="asset-manager-dropdown-item">Action 1</button>
                <button className="asset-manager-dropdown-item">Action 2</button>
                <div className="asset-manager-dropdown-divider"></div>
                <button className="asset-manager-dropdown-item asset-manager-dropdown-item--active">Active Item</button>
                <button className="asset-manager-dropdown-item">Action 4</button>
              </div>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Tooltips</h4>
            <div className="asset-manager-tooltip">
              <button className="asset-manager-button">Hover me</button>
              <div className="asset-manager-tooltip-content">
                This is a tooltip!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress and Status */}
      <section className="demo-section">
        <h3 className="demo-section-title">Progress & Status</h3>
        <div className="demo-grid">
          <div className="demo-group">
            <h4>Progress Bars</h4>
            <div className="demo-progress">
              <div className="asset-manager-progress">
                <div 
                  className="asset-manager-progress-bar" 
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
              <div className="asset-manager-progress asset-manager-progress--success">
                <div className="asset-manager-progress-bar" style={{ width: '100%' }}></div>
              </div>
              <div className="asset-manager-progress asset-manager-progress--warning">
                <div className="asset-manager-progress-bar" style={{ width: '75%' }}></div>
              </div>
              <div className="asset-manager-progress asset-manager-progress--error">
                <div className="asset-manager-progress-bar" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="demo-group">
            <h4>Badges</h4>
            <div className="demo-badges">
              <span className="asset-manager-badge">Default</span>
              <span className="asset-manager-badge asset-manager-badge--primary">Primary</span>
              <span className="asset-manager-badge asset-manager-badge--success">Success</span>
              <span className="asset-manager-badge asset-manager-badge--warning">Warning</span>
              <span className="asset-manager-badge asset-manager-badge--error">Error</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="demo-section">
        <h3 className="demo-section-title">Tabs</h3>
        <div className="asset-manager-tabs">
          <div className="asset-manager-tab-list">
            <button className="asset-manager-tab asset-manager-tab--active">Tab 1</button>
            <button className="asset-manager-tab">Tab 2</button>
            <button className="asset-manager-tab">Tab 3</button>
          </div>
          <div className="asset-manager-tab-panel">
            <p>This is the content for the active tab.</p>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="asset-manager-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="asset-manager-modal asset-manager-modal--medium" onClick={(e) => e.stopPropagation()}>
            <div className="asset-manager-modal-header">
              <h3 className="asset-manager-modal-title">Demo Modal</h3>
              <button 
                className="asset-manager-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="asset-manager-modal-body">
              <p>This is a modal dialog demonstrating the ComfyUI theme integration.</p>
              <p>It automatically adapts to light and dark themes using CSS variables.</p>
            </div>
            <div className="asset-manager-modal-footer">
              <button 
                className="asset-manager-button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="asset-manager-button asset-manager-button--primary"
                onClick={() => setIsModalOpen(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveElementsDemo;