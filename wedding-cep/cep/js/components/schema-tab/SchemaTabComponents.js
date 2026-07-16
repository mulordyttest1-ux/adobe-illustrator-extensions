import { SCHEMA_TAB_SECTIONS } from './schemaTabConfig.js';
import {
    createSchemaWrapper,
    renderSchemaSection,
    resetSchemaRefs
} from './schemaTabRenderSupport.js';

export class SchemaTabComponents {
    constructor(container, refs = {}) {
        this.container = container;
        this.refs = refs;
    }

    render() {
        this.container.innerHTML = '';
        resetSchemaRefs(this.refs);

        const documentRef = this.container.ownerDocument || document;
        const wrapper = createSchemaWrapper({ documentRef });

        SCHEMA_TAB_SECTIONS.forEach((section) => {
            wrapper.appendChild(
                renderSchemaSection(section, {
                    refs: this.refs,
                    documentRef
                })
            );
        });

        this.container.appendChild(wrapper);
    }
}
