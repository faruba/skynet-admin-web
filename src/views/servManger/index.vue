<template>
  <div class="app-container">
    <div>
      <label>模式:</label>
      <el-select v-model="mode" filterable placeholder="请选择" @change="onNodeChange">
        <el-option
          v-for="item in allModes"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </div>
    <div>
      <el-row :gutter="20">
        <div v-for="(value, key) in modeArgs" :key="key">
          <label>{{ key }}:</label>
          <el-input v-model="modeArgs[key]" size="small" :formatter="toStr" :label="key" />
        </div>
      </el-row>
      <el-button
            size="mini"
            type="danger"
            @click="showChangeArgs()"
            >修改参数
      </el-button>
    </div>
    <div>
    </div>
    <div class="content-table">
      <el-table
        :data="serverData"
        :row-key="row => row.zoneId"
        border
        style="width: 100%"
        ref="recCol"
        @select="itemSelectHandler"
        :default-sort="{prop: 'zoneId', order: 'ascending'}"
      >
        <el-table-column prop="zoneId" label="区服id" align="center" sortable />
        <el-table-column prop="serverName" label="服务器名" header-align="center" sortable />
        <el-table-column prop="activeTime" label="开服时间" align="center" :formatter="toDateStr" sortable />
        <el-table-column
        type="selection"
        label="推荐服务器"
        align="center"
        />
        <!-- <el-table-column label="推荐服务器" align="center" sortable >
            <el-checkbox v-model="scope.row.rec" />
        </el-table-column>
        -->
        <el-table-column prop="st" label="服务器状态" align="center" sortable />
        <el-table-column prop="online" label="在线人数(online)" align="center" sortable />
        <el-table-column prop="create" label="创角人数(create)" align="center" sortable />
        <el-table-column prop="load" label="负载(load)" align="center" sortable />
        <el-table-column prop="op" label="操作" align="center" >
          <template slot-scope="scope">
            <el-button
            size="mini"
            type="danger"
            @click="handleUpdate(scope.row)"
            >修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div>
      <el-input v-model="log" type="textarea" autosize readonly />
    </div>
    <el-dialog title="修改服务器信息" :visible.sync="updateNodeDialogVisible">
      <el-form :model="updateForm">
        <el-form-item label="服务器名" >
          <el-input v-model="updateForm.serverName" autocomplete="off" />
        </el-form-item>
        <el-form-item label="开服时间" >
          <el-input
            v-model="updateForm.activeTime"
            autocomplete="on"
            placeholder="格式为 YYYY:MM:DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="updateNodeDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleUpdateServer()">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改服务器参数" :visible.sync="chageArgsVisible">
      将修改为: {{ JSON.stringify(this.modeArgs) }}
      <div slot="footer" class="dialog-footer">
        <el-button @click="chageArgsVisible = false">取 消</el-button>
        <el-button type="primary" @click="chengeArgs()">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { query, update } from '@/api/serverMgr'
// import { response } from 'express'

function mergeObj(to, from) {
  for (let k in from) {
    to[k] = from[k]
  }
}
const stCfg = {
  0: 'stop',
  1: 'running',
  2: 'unknow',
  3: 'updating'
}
export default {
  computed: {
    serverData () {
      let ret = []
      for (let idx in this.serverList) {
        let v = this.serverList[idx]
        let temp = {}
        mergeObj(temp, v)
        const v2 = this.runtime[v.zoneId]
        v2.st = stCfg[v2.st] 
        mergeObj(temp, v2)
        ret.push(temp)
      }
      return ret
    }
  },
  data() {
    return {
      updateNodeDialogVisible: false,
      chageArgsVisible: false,
      updateForm: {
        zoneId: 0,
        activeTime: '',
        serverName: ''
      },
      serverList: null,
      runtime: null,
      nodename: null,
      modeArgs: null,
      allModes: null,
      mode: null,
      opt: null,
      log: null
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    showChangeArgs() {
      this.chageArgsVisible = true
      if(typeof(this.modeArgs.srvs) == 'string') {
        this.modeArgs.srvs = this.modeArgs.srvs.split(',')
      }
    },
    chengeArgs() {
      this.chageArgsVisible = false
      update(`modeArgs.${this.mode}`, this.modeArgs,'replace').then((response) => {
        if (response.code === 'OK') {
          this.$message({
            type: 'success',
            message: '更新成功'
          })
          this.fetchData()
        }
      })
    },
    toStr(v) {
      if(Array.isArray(v)) {
        return JSON.stringify(v)
      }
      return v
    },
    toDateStr(row) {
      return new Date(row.activeTime).toLocaleString('zh-cn',{ 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      })
    },
    selectable(row) {
      return row.rec
    },
    handleUpdate(row) {
      this.updateForm.zoneId = row.zoneId
      this.updateForm.serverName = row.serverName
      this.updateForm.activeTime = row.activeTime
      this.updateNodeDialogVisible = true
    },
    handleUpdateServer() {
      update('serverList', this.updateForm).then((response) => {
        if (response.code === 'OK') {
          this.$message({
            type: 'success',
            message: '更新成功'
          })
          this.fetchData()
        }
      })
    },
    itemSelectHandler(selection, row) {
      const isSelect = selection.indexOf(row) !== -1
      if (isSelect) {
        if (row[this.modeArgs.key] >= this.modeArgs.num) {
          this.$refs.recCol.toggleRowSelection(row)
          this.$message({
            type: 'warning',
            message: '人数限制'
          })
          return
        }
      }
      row.rec = isSelect
    },
    updateVal(data) {
      for (const k in data) {
        if (k === 'code') {
          continue
        }
        let v = data[k]
        if (k === 'serverList') {
          v = Object.values(v)
          this.$nextTick(function() {
            this.serverData.forEach(item => {
              console.log(item.rec, 'update')
              this.$refs.recCol.toggleRowSelection(item, item.rec)
            })
          })
        } else if (k === 'modeArgs') {
          v = v[data.mode]
        }
        this[k] = v
      }
    },
    fetchData() {
      query({ mode: 1, allModes: 1, modeArgs: 1, serverList: 1, runtime: 1, log: 1 }).then((response) => {
        if (response.code === 'OK') {
          this.updateVal(response)
        }
      })
    },
    onNodeChange(item) {
      update(`serverList.[${this.updateForm.zoneId}]`, this.updateForm, 'merge').then((response) => {
        if (response.code === 'OK') {
          this.$message({
            type: 'success',
            message: '更新成功'
          })
          this.fetchData()
        } else {
          this.$message(response)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.content-table {
  padding-top: 20px;
}
.radio-label {
  font-size: 14px;
  color: #606266;
  line-height: 40px;
  padding: 0 12px 0 30px;
}
</style>
