import React from 'react';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import PropTypes from 'prop-types';
import D from 'i18n';
import { StyleWrapper } from './component.style';

const Buttons = ({
  readonly,
  rereading,
  page,
  canContinue,
  isLastComponent,
  pagePrevious,
  pageNext,
  pageFastForward,
  finalQuit,
}) => {
  const returnLabel = page === 0 ? '' : D.goBackReturn;
  const pageNextFunction = isLastComponent ? finalQuit : pageNext;

  const keysToHandle = ['ctrl+enter', 'ctrl+backspace'];

  const keyboardShortcut = (key, e) => {
    if (key === 'ctrl+enter') {
      if (!isLastComponent && rereading && canContinue) pageNextFunction();
    }
    if (key === 'ctrl+backspace') pagePrevious();
  };

  return (
    <>
      <StyleWrapper id="buttons" className={!returnLabel && 'btn-alone'}>
        {returnLabel && (
          <div className="short-button navigation">
            <button className="navigation-button short" type="button" onClick={pagePrevious}>
              {`\u25C0`}
            </button>
            <span>{D.goBackReturn}</span>
          </div>
        )}
        {!isLastComponent && rereading && (
          <div className="short-button next navigation">
            <button
              aria-label={D.nextButtonLabel}
              className="navigation-button short"
              type="button"
              onClick={pageNext}
              disabled={!canContinue && !readonly}
            >
              {`\u25B6`}
            </button>
            <span>{D.nextButton}</span>
          </div>
        )}
        <div className="fast-button navigation">
          <button className="navigation-button" type="button" onClick={pageFastForward}>
            {`${D.fastForward} \u21E5`}
          </button>
        </div>
      </StyleWrapper>
      <KeyboardEventHandler
        handleKeys={keysToHandle}
        onKeyEvent={keyboardShortcut}
        handleFocusableElements
      />
    </>
  );
};

Buttons.propTypes = {
  readonly: PropTypes.bool.isRequired,
  rereading: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  canContinue: PropTypes.bool.isRequired,
  isLastComponent: PropTypes.bool.isRequired,
  pageNext: PropTypes.func.isRequired,
  pagePrevious: PropTypes.func.isRequired,
  pageFastForward: PropTypes.func.isRequired,
  finalQuit: PropTypes.func.isRequired,
};

export default React.memo(Buttons);
