
<template>
  <div class="page">
    <img :src="logo" alt="logo"/>
    <Foo/>
  </div>
</template>

<script>
import Foo from '@components/Foo.vue';
import logo from '~@assets/logo.png';
export default {
  components: { Foo },
  data() {
    return { logo };
  }
}
</script>

<style lang="less" scoped>
@import "~@styles/reset.less";
.page {
  padding: 20px;
}
</style>
