<template>
    <li class="WorkflowInvocationStep">

    </li>
</template>

<script>
    import WorkflowInvocationStep from "@/api/workflows";
    //TODO this is incomplete
    export default {
        name: "WorkflowInvocationStep",
        props: {
            model: {
                type: WorkflowInvocationStep,
                required: true,
            }
        }
    }
</script>

<style scoped>

</style>