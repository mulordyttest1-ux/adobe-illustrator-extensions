export function wakeFilledCompactTextareas({ container, eventFactory } = {}) {
    const scope = container || (typeof document !== 'undefined' ? document : null);
    if (!scope || typeof scope.querySelectorAll !== 'function') {
        return 0;
    }

    const createEvent = eventFactory || (() => new Event('blur'));
    let wokenCount = 0;

    scope.querySelectorAll('textarea.compact-input').forEach((textarea) => {
        if (!textarea || !textarea.value) {
            return;
        }

        textarea.dispatchEvent(createEvent());
        wokenCount += 1;
    });

    return wokenCount;
}
