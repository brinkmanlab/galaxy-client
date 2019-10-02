/**
 * Code common to all Galaxy API models
 *
 * Every model should inherit Model and be registered with a module that extends Module.
 */

// TODO https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.display_applications
// TODO https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.dynamic_tools

import { Model as VuexModel } from '@vuex-orm/core';

const HasState = {
    /**
     * This mixin expects the class to have a static list of end_states and to extend Model
     */

    /**
     * Poll model state until it is an end_state
     * @param callback Called when state changes to end_state, return true to stop polling, false to continue
     * @param extra Additional parameters passed to Model.start_polling()
     */
    poll_state(callback = ()=>true, ...extra) {
        let self = this;
        if (!this.constructor.end_states.includes(self.state)) {
            this.start_polling(()=>{
                self = self.constructor.find(self.id); // TODO recover from the reactivity system failing
                if (self.constructor.end_states.includes(self.state)) {
                    return callback();
                }
                return false;
            }, ...extra);
        }
    }
};


/**
 * Base class for API models
 */
class Model extends VuexModel {

    static fields() {
        return {
        }
    }

    /**
     * Update model state on the Galaxy server. Wraps $update() with model instance params.
     * @param fields {Array} Optional Array of strings containing field names to update
     * @param options {Object} Options to pass to $update()
     * @returns {Promise<Collections<Model>>} result of $update()
     */
    async post(fields, options={}) {
        let data = this;
        if (fields !== undefined) {
            //Only keep requested fields
            data = Object.fromEntries(
                Object.entries(data).filter(([k,_])=>fields.includes(k)) //eslint-disable-line
            );
        }
        if (data.hasOwnProperty('$toJson')) data = data.$toJson();
        else data = JSON.stringify(data);
        return await this.constructor.$update({
            ...options,
            params: {
                id: this[this.constructor.primaryKey],
                url: this.get_base_url(),
                ...options.params,
            },
            data: data,
        });
    }

    // TODO find all places this can be used and replace code
    /**
     * Update model state from Galaxy server. Wraps $get() with model instance params.
     * @param options {Object} Options to pass to $get
     * @returns {Promise<*>} result of $get()
     */
    async reload(options={}) {
        return await this.constructor.$get({
            ...options,
            params: {
                url: this.get_base_url(),
                id: this.id,
                ...options.params,
            },
        });
    }

    /**
     * Delete model on Galaxy server. Wraps $delete() with model instance params.
     * @param options {Object} Options to pass to $delete()
     * @returns {Promise<*>} result of $delete()
     */
    async delete(options = {}) {
        this.stop_polling();
        if (this.hid === -1) {
            //Delete locally if ghost item
            this.constructor.delete(this.id);
            return;
        }
        this.constructor.delete(this.id); // TODO this shouldn't be needed, the next command calls it but fails
        return await this.constructor.$delete({
            ...options,
            params: {
                id: this[this.constructor.primaryKey],
                ...options.params,
            },
        });
    }

    /**
     * Build base url for model instance specific api endpoint.
     * Models that require other model information in their api url will override this function.
     * @returns {string} Base url for model api endpoint
     */
    get_base_url() {
        return '';
    }

    /**
     * Start requesting model updates at a specified interval.
     * New update requests will not be created until the previous complete.
     * Stores handles returned by setTimeout() in window.pollHandles as a Map.
     * @param stop_criteria {CallableFunction} Callback to check if polling should stop. Return true to stop, false to continue.
     * @param options {Object} Options to pass to reload()
     * @param interval {Number} Delay in ms between request
     */
    start_polling(stop_criteria, options={}, interval=10000) {
        const self = this;
        if (!window.hasOwnProperty('pollHandles')) window.pollHandles = new Map();
        if (!window.pollHandles.has(this.id)) {
            const f = ()=>{ //TODO this can be done better :/
                self.reload(options).then(() => {
                    if (typeof stop_criteria === "function" && stop_criteria()) {
                        this.stop_polling();
                    } else {
                        // Reschedule after reload
                        window.pollHandles.set(this.id, setTimeout(f, interval));
                    }
                });
            };
            f();
        }
    }

    /**
     * Stop requesting model updates regardless of any stop criteria passed to start_polling()
     */
    stop_polling() {
        if (window.hasOwnProperty('pollHandles')) {
            const pollHandle = window.pollHandles.get(this.id);
            if (pollHandle !== undefined) {
                clearTimeout(pollHandle);
                window.pollHandles.delete(this.id);
            }
        }
    }

    /**
     * Catch model delete hook and ensure polling is stopped.
     * @param model {Model} model being deleted
     */
    static beforeDelete(model) {
        model.stop_polling();
        //VuexModel.beforeDelete(model); // TODO VuexModel.beforeDelete undefined
    }

    // TODO find all places this can be used and replace code
    /**
     * Find model with specified id, or get it from the Galaxy server
     * @param id Model id
     * @param url {string} Optional base url for model api
     * @param options {Object} Options to pass to $get
     * @returns {Promise<Model|null>} model instance if the id is found or null
     */
    static async findOrLoad(id, url='', options={}) {
        const result = this.find(id);
        if (result) return result;
        await this.$get({
            ...options,
            params: {
                id: id,
                url: url,
                ...options.params,
            },
        });
        return this.find(id);
    }

    /**
     * Allow comparison of models. If the models have the same primary key then they are considered identical.
     * @param obj Object to compare to
     * @returns {boolean|Boolean} True if models share same primary key (id), False otherwise.
     */
    is(obj) {
        if (obj.constructor.hasOwnProperty('primaryKey')) {
            //TODO are ids unique across Galaxy?
            return this[this.constructor.primaryKey] === obj[obj.constructor.primaryKey];
        } else {
            return super.is(obj);
        }
    }
}

/**
 * Base module for all models
 * @type {{namespaced: boolean}}
 */
const Module = {
    namespaced: true,
};

/**
 * Base state wrapper for all modules
 * @param state state to wrap
 * @returns {function(): Object} returns wrapped state
 */
function State(state) {
    if (state instanceof Function) state = state();
    return ()=>{return {
        ...state,
    }};
}

const Mutations = {  };
const Actions = {  };
const Getters = {  };

export {
    Model,
    Module,
    State,
    Mutations,
    Actions,
    Getters,
    HasState,
}