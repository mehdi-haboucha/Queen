import '@a11y/focus-trap';

import {
  NEXT_FOCUS,
  PREVIOUS_FOCUS,
  createArrayOfRef,
  createReachableElement,
  getNewFocusElementIndex,
} from 'utils/navigation';
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dependencies, version } from '../../../../package.json';

import { Apps } from '@material-ui/icons';
import { ButtonItemMenu } from 'components/designSystem';
import D from 'i18n';
import { IconButton } from '@material-ui/core';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import PropTypes from 'prop-types';
import SequenceNavigation from './sequenceNavigation';
import StopNavigation from './stopNavigation';
import SubsequenceNavigation from './subSequenceNavigation';
import { useStyles } from './component.style';

// import * as lunatic from '@inseefr/lunatic';

const Navigation = ({
  className,
  title,
  questionnaire,
  validatedPages,
  setMenuOpen,
  readonly,
  setPage,
}) => {
  const [open, setOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(undefined);
  const lunaticVersion = dependencies['@inseefr/lunatic'].replace('^', '');

  const specialVTLComponents = components => {
    // const localCache = {};
    return components.reduce((_, { componentType, conditionFilter, label, ...other }) => {
      if (componentType === 'Sequence') {
        // const { page } = other;
        return [
          ..._,
          {
            componentType,
            labelNav: label,
            reachable: true,
            // validatedPages?.includes(page) && getFilterValue(localCache)(conditionFilter),
            ...other,
          },
        ];
      }
      if (componentType === 'Subsequence') {
        // const { goToPage } = other;
        return [
          ..._,
          {
            componentType,
            labelNav: label,
            reachable: true,
            // validatedPages?.includes(goToPage) && getFilterValue(localCache)(conditionFilter),
            ...other,
          },
        ];
      }
      return _;
    }, []);
  };

  const componentsVTL = specialVTLComponents(questionnaire.components);

  // TODO lister les séquences du questionnaire et récupérer le component from Lunatic
  // lister les sous séquences du questionnaire et récupérer le component from Lunatic
  //

  const getSubsequenceComponents = useMemo(
    () => id =>
      componentsVTL.filter(
        ({
          componentType,
          hierarchy: {
            sequence: { id: idSequence },
          },
        }) => componentType === 'Subsequence' && idSequence === id
      ),
    [componentsVTL]
  );

  const navigationComponents = useMemo(() => {
    return surveyOpen
      ? componentsVTL.reduce((_, { id, componentType, ...other }) => {
          if (componentType === 'Sequence') {
            return [
              ..._,
              {
                id,
                componentType,
                components: getSubsequenceComponents(id),
                ...other,
              },
            ];
          }
          return _;
        }, [])
      : null;
  }, [surveyOpen, componentsVTL, getSubsequenceComponents]);
  const offset = 1;

  const menuItemsSurvey = [D.surveyNavigation];
  const menuItemsQuality = !readonly ? ['Arrêt'] : [];

  const [currentFocusElementIndex, setCurrentFocusElementIndex] = useState(0);
  const [listRefs] = useState(
    [...menuItemsSurvey, ...menuItemsQuality].reduce(
      _ => [..._, React.createRef()],
      createArrayOfRef(offset)
    )
  );

  const setFocus = useCallback(
    index => () => setCurrentFocusElementIndex(index),
    [setCurrentFocusElementIndex]
  );
  const reachableRefs = [...menuItemsSurvey, ...menuItemsQuality].reduce(
    _ => [..._, true],
    createReachableElement(offset)
  );

  const openCloseSubMenu = useCallback(
    type => {
      if (type === 'sequence') {
        setStopOpen(false);
        if (surveyOpen) {
          setSelectedSequence(undefined);
          setSurveyOpen(false);
          listRefs[1].current.focus();
        } else {
          setSurveyOpen(true);
        }
      } else if (type === 'stop') {
        setSurveyOpen(false);
        if (stopOpen) {
          setStopOpen(false);
          listRefs[2].current.focus();
        } else {
          setStopOpen(true);
        }
      }
    },
    [listRefs, stopOpen, surveyOpen]
  );

  const openCloseMenu = useCallback(() => {
    if (surveyOpen) openCloseSubMenu('sequence');
    if (stopOpen) openCloseSubMenu('stop');
    setOpen(!open);
    setMenuOpen(!open);
    listRefs[0].current.focus();
  }, [surveyOpen, openCloseSubMenu, stopOpen, open, setMenuOpen, listRefs]);

  const setNavigationPage = useCallback(
    page => {
      console.log('setting page to ', page);
      console.log(setPage);
      openCloseMenu();
      setPage(page);
    },
    [openCloseMenu, setPage]
  );

  const getKeysToHandle = () => {
    if (open && (surveyOpen || stopOpen)) return ['alt+b'];
    if (open) return ['alt+b', 'esc', 'right', 'up', 'down'];
    return ['alt+b'];
  };
  const keysToHandle = getKeysToHandle();

  const keyboardShortcut = (key, e) => {
    e.preventDefault();
    if (key === 'alt+b') {
      openCloseMenu();
    }
    if (key === 'esc' && !surveyOpen) openCloseMenu();
    if (key === 'right') {
      if (currentFocusElementIndex === 1) openCloseSubMenu('sequence');
      if (currentFocusElementIndex === 2) openCloseSubMenu('stop');
    }
    if (key === 'down' || key === 'up') {
      const directionFocus = key === 'down' ? NEXT_FOCUS : PREVIOUS_FOCUS;
      const newRefIndex =
        getNewFocusElementIndex(directionFocus)(currentFocusElementIndex)(reachableRefs);
      listRefs[newRefIndex]?.current?.focus();
    }
  };
  const classes = useStyles();

  const [trapFocus, setTrapFocus] = useState(false);

  useEffect(() => {
    setTimeout(() => setTrapFocus(open), 250);
  }, [open]);

  const rootRef = useRef();

  const menu = (
    <>
      <IconButton
        ref={listRefs[0]}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        title={D.mainMenu}
        className={classes.menuIcon}
        onClick={openCloseMenu}
        onFocus={setFocus(0)}
      >
        <Apps fontSize={'small'} htmlColor={open ? '#E30342' : '#000000'} />
      </IconButton>
      <div className={`${classes.menu}${open ? ' slideIn' : ''}`}>
        {open && (
          <>
            <div className={classes.navigationContainer}>
              <span className={classes.goToNavigationSpan}>{`${D.goToNavigation} ...`}</span>
              <nav role="navigation">
                <ul>
                  {menuItemsSurvey.map((label, index) => {
                    const type = index === 0 ? 'sequence' : '';
                    return (
                      <li key={label}>
                        <ButtonItemMenu
                          ref={listRefs[index + offset]}
                          selected={currentFocusElementIndex === index + offset}
                          onClick={() => openCloseSubMenu(type)}
                          onFocus={setFocus(index + offset)}
                        >
                          {label}
                          <span>〉</span>
                        </ButtonItemMenu>
                      </li>
                    );
                  })}
                  {menuItemsQuality.map((label, index) => {
                    const type = 'stop';
                    return (
                      <li key={label}>
                        <ButtonItemMenu
                          ref={listRefs[index + menuItemsSurvey.length + offset]}
                          selected={
                            currentFocusElementIndex === index + menuItemsSurvey.length + offset
                          }
                          onClick={() => openCloseSubMenu(type)}
                          onFocus={setFocus(index + menuItemsSurvey.length + offset)}
                        >
                          {label}
                          <span>{'\u3009'}</span>
                        </ButtonItemMenu>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
            <div
              className={classes.version}
            >{`Queen : ${version} | Lunatic : ${lunaticVersion}`}</div>
          </>
        )}
      </div>
    </>
  );
  return (
    <div ref={rootRef} className={className}>
      {trapFocus && <focus-trap>{menu}</focus-trap>}
      {!trapFocus && menu}
      {open && (
        <>
          <div
            className={`${classes.subMenuNavigationContainer} ${
              classes.sequenceNavigationContainer
            }${surveyOpen || stopOpen ? ' slideIn' : ''}`}
          >
            {surveyOpen && (
              <SequenceNavigation
                title={title}
                components={navigationComponents}
                setPage={setNavigationPage}
                setSelectedSequence={setSelectedSequence}
                subSequenceOpen={!!selectedSequence}
                close={openCloseSubMenu}
              />
            )}
            {stopOpen && <StopNavigation ref={rootRef} close={openCloseSubMenu} />}
          </div>
          {surveyOpen && (
            <div
              className={`${classes.subMenuNavigationContainer} ${
                classes.subsequenceNavigationContainer
              }${selectedSequence ? ' slideIn' : ''}`}
            >
              {selectedSequence && selectedSequence.components.length > 0 && (
                <SubsequenceNavigation
                  sequence={selectedSequence}
                  close={() => setSelectedSequence(undefined)}
                  setPage={setNavigationPage}
                />
              )}
            </div>
          )}
        </>
      )}

      {open && <div className={classes.backgroundMenu} onClick={openCloseMenu} />}

      <KeyboardEventHandler
        handleKeys={keysToHandle}
        onKeyEvent={keyboardShortcut}
        handleFocusableElements
      />
    </div>
  );
};

const comparison = (_, nextProps) => {
  return !nextProps.menuOpen;
};

Navigation.propTypes = {
  title: PropTypes.string.isRequired,
};

export default React.memo(Navigation, comparison);
