<template>
    <span class="editable-label">
        <template v-if="edited_label === null">{{ value }}</template>
        <b-input v-else
                 v-model="edited_label"
                 v-bind:pattern="pattern"
                 v-bind:formatter="value=>value.trim()"
                 v-bind:placeholder="placeholder"
                 autofocus
                 @keypress.enter="stop_edit"
                 @blur="stop_edit"
                 @click.stop
                 ref="editbox"
        ></b-input>
    </span>
</template>

<script>

    /**
     * Editable label
     * Provides a text input in place of a label when activated
     */
    export default {
        name: "EditableLabel",
        props: {
            /**
             * Label value
             */
            value: {
                type: String,
                required: true,
            },

            /**
             * Placeholder text while editing
             */
            placeholder: {
                type: String,
                default: '',
            },

            /**
             * Label validation regex
             */
            pattern: {
                type: String,
                default: '.+',
            },
        },
        data: ()=>{return{
            edited_label: null,
        }},
        methods: {
            /**
             * Show label editor
             * @public
             */
            start_edit() {
                this.edited_label = this.value;
                this.$nextTick(()=>{
                    this.$refs.editbox.focus();
                    this.$refs.editbox.select();
                });
            },

            /**
             * Hide label editor and commit changes
             * @public
             */
            stop_edit() {
                if (this.edited_label !== null) {
                    this.$emit('update', this.edited_label); // TODO change to input to support v-model
                }
                this.edited_label = null;
            },

            /**
             * Hide label editor and discard changes
             * @public
             */
            cancel_edit() {
                this.edited_label = null;
            },
        },
    }
</script>

<style scoped>
    .editable-label input {
        font-size: inherit;
        padding: 0;
        height: unset;
    }
</style>