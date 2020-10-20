import {
    action,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { log } from '../../../background/utils/log';
import messenger from '../../services/messenger';
import {
    EVENTS as SAVING_FSM_EVENTS,
    createSavingService,
} from '../components/Editor/savingFSM';
import { sleep } from '../../helpers';

const savingUserRulesService = createSavingService({
    id: 'userRules',
    services: {
        saveData: (_, e) => messenger.saveUserRules(e.value),
    },
});

const savingWhitelistService = createSavingService({
    id: 'whitelist',
    services: {
        saveData: async (_, e) => {
            /**
             * If saveWhitelist executes faster than MIN_EXECUTION_TIME_REQUIRED_MS we increase
             * execution time for smoother user experience
             */
            const MIN_EXECUTION_TIME_REQUIRED_MS = 500;
            const start = Date.now();
            await messenger.saveWhitelist(e.value);
            const end = Date.now();
            const timePassed = end - start;
            if (timePassed < MIN_EXECUTION_TIME_REQUIRED_MS) {
                await sleep(MIN_EXECUTION_TIME_REQUIRED_MS - timePassed);
            }
        },
    },
});

class SettingsStore {
    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filtersMetadata = {};

    @observable allowAcceptableAds = null;

    @observable userRules = '';

    @observable whitelist = '';

    @observable savingRulesState = savingUserRulesService.initialState.value;

    @observable savingWhitelistState = savingWhitelistService.initialState.value;

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;

        savingUserRulesService.onTransition((state) => {
            runInAction(() => {
                this.savingRulesState = state.value;
            });
        });

        savingWhitelistService.onTransition((state) => {
            runInAction(() => {
                this.savingWhitelistState = state.value;
            });
        });
    }

    @action
    async requestOptionsData() {
        const data = await messenger.getOptionsData();
        runInAction(() => {
            this.settings = data.settings;
            this.filtersMetadata = data.filtersMetadata;
            this.version = data.appVersion;
            this.constants = data.constants;
            this.optionsReadyToRender = true;
            this.setAllowAcceptableAds(data.filtersMetadata.filters);
        });
    }

    @action
    async updateSetting(settingId, value) {
        await messenger.changeUserSetting(settingId, value);
        runInAction(() => {
            this.settings.values[settingId] = value;
        });
    }

    @action
    setAllowAcceptableAds(filters) {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const allowAcceptableAdsFilter = filters
            .find((f) => f.filterId === SEARCH_AND_SELF_PROMO_FILTER_ID);
        this.allowAcceptableAds = !!(allowAcceptableAdsFilter.enabled);
    }

    @action
    async setAllowAcceptableAdsValue(value) {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const prevValue = this.allowAcceptableAds;
        this.allowAcceptableAds = value;
        try {
            if (value) {
                await messenger.enableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
            } else {
                await messenger.disableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
            }
        } catch (e) {
            runInAction(() => {
                this.allowAcceptableAds = prevValue;
            });
        }
    }

    @action
    setUserRules = (userRules) => {
        this.userRules = userRules;
    }

    @action
    async getUserRules() {
        try {
            const { content } = await messenger.getUserRules();
            this.setUserRules(content);
        } catch (e) {
            log.debug(e);
        }
    }

    @action
    async saveUserRules(value) {
        this.userRules = value;
        savingUserRulesService.send(SAVING_FSM_EVENTS.SAVE, { value });
    }

    @action
    setWhitelist = (whitelist) => {
        this.whitelist = whitelist;
    }

    @action
    async getWhitelist() {
        try {
            const { content } = await messenger.getWhitelist();
            runInAction(() => {
                this.whitelist = content;
            });
        } catch (e) {
            log.debug(e);
        }
    }

    @action
    saveWhitelist = (whitelist) => {
        this.whitelist = whitelist;
        savingWhitelistService.send(SAVING_FSM_EVENTS.SAVE, { value: whitelist });
    }
}

export default SettingsStore;