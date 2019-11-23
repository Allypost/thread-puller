import Vue from 'vue';

export function mutationSet(
    {
        identifierKey = 'id',
        entriesKey = 'entries',
    } = {},
) {
    return {
        set(state, newEntries) {
            Vue.set(state, entriesKey, newEntries);
        },

        add(state, ...newEntries) {
            Vue.set(state, entriesKey, [ ...state[ entriesKey ], ...newEntries ]);
        },

        update(state, newEntry) {
            const entries = state[ entriesKey ];
            const index = entries.findIndex((entry) => entry[ identifierKey ] === newEntry[ identifierKey ]);

            if (-1 === index) {
                return Vue.set(state, entriesKey, [ ...entries, newEntry ]);
            }

            Vue.set(entries, index, newEntry);
        },

        remove({ [ entriesKey ]: entries }, id) {
            const deletedEntryIndex = entries.findIndex(({ [ identifierKey ]: deletedId }) => deletedId === id);

            Vue.delete(entries, deletedEntryIndex);
        },
    };
}
