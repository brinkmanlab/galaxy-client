<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
    <div class="galaxy-history">
        <EditableLabel class="galaxy-history-label" @update="update_label" v-bind:value="model.name" placeholder="Enter a label" ref="label"/>
        <span class="galaxy-history-state">{{ model.state }}</span>
        <time class="galaxy-history-updated" v-bind:datetime="model.update_time">{{ (new Date(model.update_time)).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) }}</time>
        <slot v-bind:model="model" class="galaxy_history_slot"/>
        <HistoryFunctions v-bind:item="self">
            <template v-slot:default="slot">
                <slot name="functions" v-bind="self" />
                <!--TODOa @click.stop.prevent="download" href="">Prepare Download</a-->
                <RenameHistory v-bind:item="slot.item" v-on:galaxy-history-rename="$refs.label.start_edit()"/>
                <RemoveHistory v-bind:item="slot.item" v-on="$listeners"/>
            </template>
        </HistoryFunctions>
        <slot name="contents" v-bind="self" class="galaxy-history-contents"/>
    </div>
</template>

<script>
    import { History } from "../api/histories";
    import EditableLabel from "../misc/EditableLabel";
    import HistoryFunctions from "../histories/HistoryFunctions"
    import RemoveHistory from "../histories/HistoryFunctions/Remove";
    import RenameHistory from "../histories/HistoryFunctions/Rename";

    /**
     * History
     */
    export default {
        name: "History",
        components: {HistoryFunctions, RemoveHistory, RenameHistory, EditableLabel},
        props: {
            /**
             * History model instance
             */
            model: {
                type: History,
                required: true,
            },
        },
        data() {return {
            self: this,
        }},
        methods: {
            /**
             * Handle input from editable label
             * @param value {string} New label value
             */
            update_label(value) {
                this.model.name = value;
                this.model.put(['name']);
            },
        },
        created() {
            const self = this;
            // Poll state if pending items
            this.model.poll_state(()=>{self.$emit('history-completed', self); return true;});
        },
        beforeDestroy() {
            if (this.model) this.model.stop_polling();
        }
    }
</script>

<style scoped>

</style>
