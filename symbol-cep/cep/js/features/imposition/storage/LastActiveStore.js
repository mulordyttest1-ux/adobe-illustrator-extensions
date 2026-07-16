import { LEGACY_LOCALSTORAGE_KEY } from './storageHelpers.js';

export class LastActiveStore {
    constructor(environment) {
        this.environment = environment;
        this.key = `${LEGACY_LOCALSTORAGE_KEY}_last_active`;
    }

    save(id) {
        this.environment.setLocalValue(this.key, id);
    }

    get() {
        return this.environment.getLocalValue(this.key);
    }
}
