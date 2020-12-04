import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const [showPopup, setShowPopup] = useState(false);

    const ref = useRef(null);

    const { logStore } = useContext(rootStore);
    const {
        searchRegular,
        searchWhitelisted,
        searchBlocked,
        searchModified,
        searchUserFilter,
        searchParty,
    } = logStore.miscellaneousFilters;

    const {
        SEARCH_FIRST_PARTY,
        SEARCH_THIRD_PARTY,
        SEARCH_ALL,
    } = logStore.searchPartyFilter;

    const filtersCheckboxHandler = (filter) => (e) => {
        logStore.setMiscellaneousFilterValue(filter, e.target.checked);
    };

    const radioHandler = (e) => {
        logStore.setMiscellaneousFilterValue('searchParty', e.target.value);
    };

    const hidePopup = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
            setShowPopup(false);
            document.removeEventListener('click', hidePopup);
        }
    };

    const miscellaneousFiltersButtonHandler = () => {
        if (!showPopup) {
            setShowPopup(true);
            document.addEventListener('click', hidePopup);
        }
    };

    const filtersClassNames = (name, value) => classNames(
        name,
        { active: value },
    );

    // FIXME add new messages to translations
    return (
        <div className="miscellaneous-filters">
            <button
                className="miscellaneous-filters__button"
                type="button"
                onClick={miscellaneousFiltersButtonHandler}
            >
                Filters
            </button>
            <div className={filtersClassNames('miscellaneous-filters__filters', showPopup)} ref={ref}>
                <div className="miscellaneous-filters__section">
                    <label className="checkbox-label" htmlFor="regular">
                        <input
                            type="checkbox"
                            id="regular"
                            name="regular"
                            onClick={filtersCheckboxHandler('searchRegular')}
                            value={searchRegular}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchRegular)} />
                        Regular
                    </label>

                    <label className="checkbox-label" htmlFor="whitelisted">
                        <input
                            type="checkbox"
                            id="whitelisted"
                            name="whitelisted"
                            onClick={filtersCheckboxHandler('searchWhitelisted')}
                            value={searchWhitelisted}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchWhitelisted)} />
                        Whitelisted
                    </label>

                    <label className="checkbox-label" htmlFor="blocked">
                        <input
                            type="checkbox"
                            id="blocked"
                            name="blocked"
                            onClick={filtersCheckboxHandler('searchBlocked')}
                            value={searchBlocked}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchBlocked)} />
                        Blocked
                    </label>

                    <label className="checkbox-label" htmlFor="modified">
                        <input
                            type="checkbox"
                            id="modified"
                            name="modified"
                            onClick={filtersCheckboxHandler('searchModified')}
                            value={searchModified}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchModified)} />
                        Modified
                    </label>

                    <label className="checkbox-label" htmlFor="user-filter">
                        <input
                            type="checkbox"
                            id="user-filter"
                            name="user-filter"
                            onClick={filtersCheckboxHandler('searchUserFilter')}
                            value={searchUserFilter}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchUserFilter)} />
                        User filter
                    </label>
                </div>

                <div className="hrow" />

                <div className="miscellaneous-filters__section">
                    <label className="radio-button-label" htmlFor="first-third-party">
                        <input
                            type="radio"
                            id="first-third-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_ALL}
                        />
                        <div className={filtersClassNames('radio-button', searchParty === SEARCH_ALL)} />
                        All
                    </label>

                    <label className="radio-button-label" htmlFor="first-party">
                        <input
                            type="radio"
                            id="first-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_FIRST_PARTY}
                        />
                        <div className={filtersClassNames('radio-button', searchParty === SEARCH_FIRST_PARTY)} />
                        First party
                    </label>

                    <label className="radio-button-label" htmlFor="third-party">
                        <input
                            type="radio"
                            id="third-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_THIRD_PARTY}
                        />
                        <div className={filtersClassNames('radio-button', searchParty === SEARCH_THIRD_PARTY)} />
                        Third party
                    </label>
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };