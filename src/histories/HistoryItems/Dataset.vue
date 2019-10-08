<template>
    <HistoryItem v-bind="$props">
        <!--span>{{model.state}}</span>
        <div class="HistoryItemAdv">
            <HistoryItemFunctions />
            <DatasetPreview />
        </div-->
    </HistoryItem>
</template>

<script>
    import HistoryItem from "../HistoryItem";

    /**
     * History Dataset
     */
    export default {
        extends: HistoryItem,
        name: "Dataset",
        components: {
            HistoryItem,
            //DatasetPreview,
        },
        data: ()=>{return{
        }},
        props: {
        },
        computed: {
        },
        methods: {
        },
        mounted() {
        },
    }
</script>

<style scoped>

</style>