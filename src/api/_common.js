/**
 * Code common to all Galaxy API models
 *
 * Every model should inherit Model and be registered with a module that extends Module.
 */

// TODO https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.display_applications
// TODO https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.dynamic_tools

import { Model as VuexModel } from '@vuex-orm/core';
import _merge from 'lodash.merge'

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
        this.poll_state_callback(undefined, callback, ...extra);
    },


    /**
     * Poll state_callback until it is an end_state
     * @param state_callback Callback that must return a string containing the models state, the callback receives the model as a parameter
     * @param callback Called when state changes to end_state, return true to stop polling, false to continue
     * @param extra Additional parameters passed to Model.start_polling()
     */
    poll_state_callback(state_callback = undefined, callback = ()=>true, ...extra) {
        let self = this;
        if (state_callback === undefined) state_callback = self=>self.state;
        if (!this.constructor.end_states.includes(state_callback(self))) {
            this.start_polling(()=>{
                self = self.constructor.find(self[self.constructor.primaryKey]); // TODO recover from the reactivity system failing, this doesn't recover relationships
                if (self.constructor.end_states.includes(state_callback(self))) {
                    return callback();
                }
                return false;
            }, ...extra);
        } else {
            callback();
        }
    },
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
     * Build base url for model instance specific api endpoint.
     * Models that require other model information in their api url will override this function.
     * @returns {string} Base url for model api endpoint
     */
    build_url() {
        return `${this.constructor.build_url()}${this[this.constructor.primaryKey]}/`;
    }

    static build_url() {
        return this.apiPath;
    }

    static async doRequest(request, config) {
        try {
            const axiosResponse = await this.axios.request(config);
            return request.createResponse(axiosResponse, config);
        } catch (err) {
            console.log(`Error: ${this.entity} failed request:`, request, config);
            throw(err);
        }
    }

    static createConfig(request, config) {
        return _merge({},
            request.config,
            request.model.globalApiConfig,
            request.model.apiConfig,
            config
        );
    }

    createConfig(request, config) {
        return this.constructor.createConfig(request, config);
    }

    static async request(method, config) {
        const request = (this.api && this.api()) || this.constructor.api(); // Allow rebinding this to model instance
        const requestConfig = this.createConfig(request, {method, ...config});
        if (!requestConfig.url) requestConfig.url = this.build_url();

        return (this.doRequest && this.doRequest(request, requestConfig)) || this.constructor.doRequest(request, requestConfig); // Allow rebinding this to model instance
    }

    async request(method, config) {
        return this.constructor.request.call(this, method, config);
    }

    static async post(data, options) {
        const response = await this.request("post", {data, ...options});

        if (response.entities) {
            return response.entities[this.entity][0]; // There should only be one
        }
        return null;
    }

    /**
     * Update model state on the Galaxy server. Wraps api().put() with model instance params.
     * @param fields {Array} Optional Array of strings containing field names to update
     * @param options {Object} Options to pass to put()
     * @returns {Promise<Response>} result of api().put()
     */
    async put(fields, options={}) {
        let data = this;
        if (fields !== undefined) {
            //Only keep requested fields
            data = Object.fromEntries(
                Object.entries(data).filter(([k,_])=>fields.includes(k)) //eslint-disable-line
            );
        }
        if (data.hasOwnProperty('$toJson')) data = data.$toJson();
        else data = JSON.stringify(data);

        return this.request('put', {data, ...options});
    }

    // TODO find all places this can be used and replace code
    /**
     * Update model state from Galaxy server. Wraps api().get() with model instance params.
     * @param options {Object} Options to pass to $get
     * @returns {Promise<*>} result of $get()
     */
    async reload(options={}) {
        return this.request('get', options);
    }

    /**
     * Delete model on Galaxy server. Wraps $delete() with model instance params.
     * @param options {Object} Options to pass to $delete()
     * @returns {Promise<*>} result of delete()
     */
    async delete(options = {}) {
        this.stop_polling();

        //Delete locally first
        const result = this.constructor.delete(this[this.constructor.primaryKey]);
        if (options.local_only) return result;

        return this.request('delete', options);
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
        if (typeof stop_criteria !== "function") stop_criteria = ()=>false;
        if (!window.hasOwnProperty('pollHandles')) window.pollHandles = new Map();
        if (!window.pollHandles.has(this.id)) {
            const f = ()=>{ //Make following code block passable to setTimeout
                // Prevent race condition allowing orphaned instances of f to continue polling
                if (f.pollHandle === undefined || f.pollHandle === window.pollHandles.get(this.id)) {
                    self.reload(options).then(() => {
                        if (stop_criteria()) {
                            self.stop_polling();
                        } else {
                            // Reschedule after reload
                            f.pollHandle = setTimeout(f, interval);
                            window.pollHandles.set(self.id, f.pollHandle);
                        }
                    }).catch(() => {
                        // Reschedule if reload fails (possibly due to a connection error)
                        f.pollHandle = setTimeout(f, interval);
                        window.pollHandles.set(self.id, f.pollHandle);
                    });
                }
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
     * @param options {Object} Options to pass to api().get()
     * @returns {Promise<Model|null>} model instance if the id is found or null
     */
    static async findOrLoad(id, options={}) {
        const result = this.find(id);
        if (result) return result;

        const response = await this.request('get', options);
        if (response.entities) {
            return response.entities[this.entity][0]; // There should only be one
        }
        return this.find(id);
    }

    static async fetch(options) {
        const response = await this.request('get', options);
        if (response.entities) {
            return response.entities[this.entity];
        }
        return this.all();
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
