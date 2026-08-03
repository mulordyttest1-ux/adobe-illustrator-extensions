import { VenueAutomation } from '@wedding/domain';
import { InputEngine } from '../../logic/ux/InputEngine.js';
import {
    bindVenueRefreshTriggers,
    createVenueContext,
    getCurrentHost,
    refreshVenueSections,
    updateHostFromLe,
    wireManualVenueCancellation
} from './formLogicSupport.js';

export class FormLogic {
    constructor(builder, { inputEngine = InputEngine } = {}) {
        this.builder = builder;
        this.inputEngine = inputEngine;
        this._createChangeEvent = () => new Event('change', { bubbles: true });
    }

    setupAutoVenue() {
        const context = createVenueContext(this.builder);
        if (!context) {
            return;
        }

        bindVenueRefreshTriggers({
            context,
            onLeChange: (leValue) => {
                updateHostFromLe({
                    leValue,
                    refs: context.refs,
                    triggers: context.triggers,
                    hostValues: context.hostValues,
                    createChangeEvent: this._createChangeEvent
                });
            },
            onHostChange: (hostValue) => this._refreshVenueSections(hostValue, context),
            onAddressChange: () => this._refreshVenueSections(getCurrentHost(context), context),
            onAutoToggle: () => this._refreshVenueSections(getCurrentHost(context), context)
        });
        wireManualVenueCancellation({
            refs: context.refs,
            createChangeEvent: this._createChangeEvent
        });
        this._refreshVenueSections(getCurrentHost(context), context);
    }

    _refreshVenueSections(hostValue, context) {
        refreshVenueSections({
            hostValue,
            context,
            venueAutomation: VenueAutomation,
            onCeremonyAddressChanged: (sourceAddr) => {
                this.inputEngine.process(sourceAddr, 'ceremony.diachi', {}, this.builder.schema);
            }
        });
    }
}
