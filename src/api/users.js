/**
 * Code responsible for interacting with /api/users
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.users
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.authenticate
 *
 * Implements GET /api/authenticate/baseauth
 * Implements GET /api/whoami
 *
 */
import * as Common from "./_common";

/**
 * Model representing a Galaxy user
 */
class User extends Common.Model {
    static entity = 'Users';
    static primaryKey = 'id';
    static apiPath = '/api/users/';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null).nullable(),
            username: this.string(null).nullable(),
            quota_percent: this.number(null).nullable(),
            preferences: this.attr({}),
            total_disk_usage: this.number(0),
            deleted: this.boolean(false),
            purged: this.boolean(false),
            nice_total_disk_usage: this.string("None"),
            quota: this.string("unlimited"),
            email: this.string(null).nullable(),
            is_admin: this.boolean(false),
            tags_used: this.attr([]),
        }
    }

    /**
     * Get the model of the current user.
     * This requires that a api key was already registered with axios for the request.
     * @returns {Promise<User|null>}
     */
    static async getCurrent() {
        let response = await this.request('get', {url: this.build_url() + "current"});
        return response.entities[this.entity][0];
    }

    /**
     * Register a user with the Galaxy backend
     * @param username Username of the new user
     * @param password Password for the new user
     * @param email Email of the new user
     * @returns {Promise<User>} User instance
     */
    static async registerUser(username, password, email) {
        // TODO This requires patching galaxy/webapps/galaxy/api/users.py#UserAPIController.create to enable anyone to create a user
        return this.post({
           username,
           password,
           email,
        });
    }

    // TODO GET /api/users/deleted Displays a collection (list) of deleted users.
    // TODO GET /api/users/deleted/{encoded_id}
    // TODO GET /api/users/{id}/information/inputs
    // TODO PUT /api/users/{id}/information/inputs
    // TODO GET /api/users/{id}/custom_builds
    // TODO PUT /api/users/{id}/custom_builds/{key}
    // TODO DELETE /api/users/{id}/custom_builds/{key}

    // TODO GET /api/whoami

    //GET /api/authenticate/baseauth
    /**
     * Get the api key for a user.
     * Uses the baseauth method of authenticating with Galaxy.
     * @param username {string} Username of user
     * @param password {string} Password for user
     * @param method {string} Method to use to authenticate. Currently only default 'baseauth' is supported.
     * @returns {Promise<string>} API key for user
     */
    static async getAPIKey(username, password, method = 'baseauth') {
        let response;
        try {
            switch (method) {
                case 'baseauth':
                    response = await this.api().get('/api/authenticate/baseauth', {
                        auth: {username, password},
                        save: false,
                    });
                    return response.response.data.api_key;
                default:
                    // TODO When Galaxy adds more API authentication methods, implement here
                    throw Error(method + ' authentication method not implemented');
            }
        } catch (error) {
            // Galaxy returns 404 when user does not exist
            if (error.response && error.response.status === 404) return '';
            // Retry request for all other errors after delay
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    /**
     * Verify the api key is valid
     * @param key API key to validate
     * @returns {Promise<boolean>} True if valid, false otherwise.
     */
    static async verifyAPIKey(key) {
        // TODO centralise all network error handling and recovery
        for (let i = 0; i < 40; ++i) { // Retry 40 times (20 seconds)
            try {
                await this.api().get('/api/whoami', {
                    params: {
                        key,
                    },
                    save: false,
                });
                return true;
            } catch (error) {
                // Galaxy returns 403 when unauthenticated
                if (error.response && error.response.status === 403) return false;
                // Retry request for all other errors after delay
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        throw Error("Unable to connect to backend");
    }
}

const Module = {
    ...Common.Module,
    state: Common.State({

    }),
    mutations: {
        ...Common.Mutations,
    },
    actions: {
        ...Common.Actions,
    },
    getters: {
        ...Common.Getters,
    },
};

function register(database) {
    database.register(User, Module);
}

export {
    User,
    Module,
    register,
};
