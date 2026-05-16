<template>
  <div>
    <el-select
      placeholder="请选择会员等级"
      v-model="selectedMemberLevelId"
      filterable
      clearable
    >
      <el-option
        v-for="item in memberLevels"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: [String, Number],
      default: ''
    }
  },
  data () {
    return {
      memberLevels: []
    }
  },
  computed: {
    selectedMemberLevelId: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
        const selectedItem = this.memberLevels.find(item => item.id === val)
        if (selectedItem) {
          this.$emit('selected-item', selectedItem)
        }
      }
    }
  },
  mounted () {
    this.getMemberLevels()
  },
  methods: {
    getMemberLevels () {
      this.$http({
        url: this.$http.adornUrl('/member/memberlevel/getMemberSelect'),
        method: 'get',
        params: this.$http.adornParams({})
      })
        .then(({data}) => {
          this.memberLevels = data.data || []
        })
        .catch(() => {
          this.memberLevels = []
        })
    }
  }
}
</script>
