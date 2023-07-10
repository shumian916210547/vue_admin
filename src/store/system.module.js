import { loadAllSchema } from '@/service/schema.service'
export default {
    state: {
        tables: [],
        schemas: [],
        modules: []
    },
    getters: {
        GET_TABLES: (state) => {
            return state.tables
        },

        GET_SCHEMAS: (state) => {
            return state.schemas
        },

        GET_MODULES: (state) => {
            return state.modules
        }
    },
    mutations: {
        SET_TABLES: (state, value) => {
            state.tables = value
        },

        SET_SCHEMAS: (state, value) => {
            state.schemas = value
        },

        SET_MODULES: (state, value) => {
            state.modules = value
        }
    },
    actions: {
        SET_SCHEMAS: (context) => {
            loadAllSchema().then(res => {
                context.commit('SET_SCHEMAS', [...res])
            })
        }
    },
};
