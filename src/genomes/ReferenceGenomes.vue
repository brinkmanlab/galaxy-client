<template>
    <b-container class="galaxy-reference-genomes">
        <b-row>
            <b-input-group size="sm" prepend="Filter">
                <b-form-input
                        v-bind:value="filter"
                        @input="update_filter"
                        type="search"
                        placeholder="Type to Search"
                />
                <b-input-group-append>
                    <b-button :disabled="!filter" @click="filter = ''">Clear</b-button>
                </b-input-group-append>
            </b-input-group>
        </b-row>
        <b-table hover small borderless selectable show-empty
                 select-mode="single"
                 v-bind:items="genomes"
                 v-bind:busy="isLoading"
                 v-bind:fields="[{key: 'name', sortable: true}]"
                 v-bind:current-page="currentPage"
                 v-bind:per-page="perPage"
                 v-bind:filter="filter"
                 v-bind:filter-function="filterFunc"
                 primary-key="id"
                 @row-selected="row_selected"
                 thead-class="hidden_header"
                 ref="table"
        >
            <template slot="table-busy">
                <div class="text-center">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                </div>
            </template>
        </b-table>
        <b-row align-h="center">
            <b-pagination
                    v-model="currentPage"
                    :per-page="perPage"
                    :total-rows="totalRows"
                    limit="8"
            ></b-pagination>
        </b-row>
    </b-container>
</template>

<script>
    import { Genome } from "@/api/genomes";

    /**
     * Selectable list of reference genomes available from /api/genomes
     */
    export default {
        name: "ReferenceGenomes",
        props: {
            /**
             * Number to list per page
             */
            perPage: {
                type: Number,
                default: 10,
            },

            /**
             * Initial selected genome
             * @model
             */
            value: {
                type: String,
                default: '',
            },

            /**
             * Delay in ms to wait for user to stop typing before applying filter
             */
            filter_delay: {
                type: Number,
                default: 500,
            }
        },
        data(){return{
            currentPage: 1,
            filter: "",
            filter_delay_handle: null,
        }},
        methods: {
            /**
             * Translate row selection event of b-table to input event
             * Only emits first selected genome
             * @param list {Array<Genome>} Selected genomes
             */
            row_selected(list) {
                if (list.length)
                    this.$emit('input', list[0]);
                else
                    this.$emit('input', null);
            },

            /**
             * Clear selection
             * @public
             */
            clearSelected() { this.$refs.table.clearSelected(); this.$emit('input', null); },

            /**
             * Filter function used by b-table
             * @param row {Genome} row being evaluated for filtering
             * @param filter {string} Filter string provided to b-table
             * @returns {boolean} True to display row, False otherwise
             */
            filterFunc(row, filter) {
                return row.name.toLowerCase().includes(filter); // Case insensitive search
            },

            /**
             * Handle user filter input event
             * Updates table after a delay, without a delay it updates on each keypress
             * causing performance issues when there are a lot of genomes.
             * @param filter {string} filter criteria
             */
            update_filter(filter) {
                // Delay the filter slightly to reduce lag and allow the user to continue typing
                if (this.filter_delay_handle !== null) window.clearTimeout(this.filter_delay_handle);
                this.filter_delay_handle = window.setTimeout(t=>t.filter = filter.toLowerCase(), this.filter_delay, this);
            }
        },
        computed: {
            /**
             * Total number of rows
             * @returns {Number} Number of rows
             */
            totalRows() {
                return this.genomes.length;
            },

            /**
             * Loading state of genomes
             * @returns {boolean} True if loading, False otherwise
             */
            isLoading() {
                return this.genomes.length === 0;
            }
        },
        asyncComputed: {
            /**
             * List of genomes
             */
            genomes: {
                async get() {
                    let genomes = Genome.query().orderBy('name').get();
                    if (genomes.length === 0) {
                        // Fetch once
                        await Genome.$fetch();
                        genomes = Genome.query().orderBy('name').get();
                    }
                    return genomes;
                },
                default: [],
            }
        },
        mounted() {
            if (this.value) {
                // Select the initial value in the b-table
                for (const [index, genome] of this.genomes().elements()) {
                    if (this.value === genome.id) {
                        this.$refs.table.selectRow(index);
                        break;
                    }
                }
            }
        },
    }
</script>

<style>
    .galaxy-reference-genomes .hidden_header {
        display: none;
    }

    .galaxy-history-contents .row:first-child {
        flex-wrap: nowrap;
        align-items: center;
    }
</style>