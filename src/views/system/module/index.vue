<template>
  <section class="module-page">
    <header class="module-page__heading">
      <div>
        <span class="module-page__eyebrow">导航与权限</span>
        <h1>模块管理</h1>
        <p>维护后台菜单模块及其子路由，路由可关联到已配置的数据表页面或组件。</p>
      </div>
    </header>

    <CommonPage ref="commonPage" :className="'Module'" @add="handleAdd" :innerContainer="true" innerContainerTitle="新增">
      <!-- 路由列表 -->
      <template #innerContainer="{ record }">
        <el-table size="small" width="100%" class="module-page__route-table" :data="formattingData(record.routes)" row-key="objectId" border>
          <el-table-column
            v-for="column in columns"
            :key="column.key"
            :prop="column.dataIndex"
            :label="column.title"
            :width="column.width"
            :min-width="column.minWidth || (column.width ? undefined : 140)"
            :fixed="column.fixed"
            :class-name="column.className"
          >
          <template #default="{ row, $index }">
            <template v-if="column.key === 'operation'">
              <div class="module-page__row-actions">
                <span class="table-operation">
                  <el-button size="small" @click="handleEdit(record, $index)" v-permission="['permission:edit', permissions]">
                    修改
                  </el-button>
                  <el-divider direction="vertical" />
                  <el-popconfirm title="删除路由后不可恢复，确定继续吗？" confirm-button-text="删除" cancel-button-text="取消"
                    @confirm="handleDelete(record, $index)">
                    <template #reference>
                    <el-button size="small" type="danger" v-permission="['permission:remove', permissions]">
                      删除
                    </el-button>
                    </template>
                  </el-popconfirm>
                </span>
              </div>
            </template>
            <template v-else>
              <el-tooltip placement="top" :content="String(row[column.key]?.name || row[column.key] || '')">
                <template #content>
                  <span>
                    {{
                      row[column.key]?.name || row[column.key]
                    }}
                  </span>
                </template>
                <p class="module-page__cell-text">
                  {{
                    row[column.key]?.name || row[column.key]
                  }}
                </p>
              </el-tooltip>
            </template>
          </template>
          </el-table-column>
        </el-table>
      </template>
    </CommonPage>

    <!-- 路由编辑 -->
    <CommonForm :className="'Route'" :fields="formFields" :editState="editState" :type="modalState.type"
      v-model="modalState.show" @onOk="handleSubmit"></CommonForm>
  </section>
</template>


<script setup>
import CommonPage from "@/components/CommonPage.vue";
import { onMounted, reactive, ref, watch } from "vue";
import moment from "moment";
import { deepClone } from "@/utils/utils";
import {
  UpdateById,
  UpdateRoute,
  ModuleUpdateRoute,
  DeleteRoute,
} from "@/service/module.service";
import CommonForm from "@/components/CommonForm.vue";
import { findAll, findSchema } from "@/service/base.service";
import { defaultFields } from "@/service/schema.service";

import { Mixins } from "@/mixins";
import Parse from "@/service/parse-client";

const { queryPermission } = Mixins();

/**
 * 查询“路由管理”页面对应的 Route 元数据标识。
 * @returns {Promise<string | undefined>} 找到时返回 Route 的 objectId；元数据尚未初始化时返回 undefined。
 * @throws {Error} BFF 请求失败时向页面 Suspense 边界抛出异常。
 */
const queryRouteId = async () => {
  const query = new Parse.Query("Route");
  query.equalTo("targetClass", "Route");
  const result = await query.first();
  return result?.id;
};
const routeId = await queryRouteId();
const permissions = await queryPermission(routeId);

const commonPage = ref();
const modalState = reactive({
  type: "add",
  show: false,
});
const editState = reactive({});
watch(
  () => modalState.show,
  (n) => {
    if (!n) {
      Object.keys(fields).forEach((key) => {
        editState[key] = fields[key].defaultValue || undefined;
      });
    }
  },
  { deep: true }
);

/* 添加路由 */
const handleAdd = (arg) => {
  modalState.type = "add";
  modalState.show = true;
  editState["moduleId"] = arg.objectId;
  editState["routes"] = arg.routes || [];
};

/* 编辑路由 */
const handleEdit = (record, index) => {
  editState["moduleId"] = record.objectId;
  editState["routes"] = deepClone(record.routes);
  modalState.type = "edit";
  Object.keys(record.routes[index]).forEach((key) => {
    if (Object.keys(fields).includes(key)) {
      editState[key] = record.routes[index][key];
    }
  });
  editState["index"] = index;
  modalState.show = true;
};

/* 删除路由 */
const handleDelete = async (record, index) => {
  await DeleteRoute(record.routes.splice(index, 1)[0]);
  await ModuleUpdateRoute(
    record.objectId,
    record.routes.map((item) => {
      item.__type = "Pointer";
      return item;
    })
  );
  await commonPage.value.loadData(commonPage.value.queryState);
};

/* 上传数据 */
const handleSubmit = async (arg) => {
  switch (modalState.type) {
    case "add":
      await UpdateById(editState.moduleId, arg);
      break;
    case "edit":
      await UpdateRoute({ ...editState.routes[editState.index], ...arg });
      break;
    default:
      break;
  }
  modalState.show = false;
  await commonPage.value?.loadData(commonPage.value.queryState);
};
let fields = reactive({});
const columns = reactive([]);
const formFields = reactive({});
/* 获取table路由并且保存 */
const systemFields = defaultFields.map((item) => item.fieldName);
const loadFields = async () => {
  const result = await findSchema({ className: "Route" });
  if (!result) return;
  Object.keys(result.get("fields")).forEach((key) => {
    fields[key] = result.get("fields")[key];
    if (!systemFields.includes(key)) {
      formFields[key] = result.get("fields")[key];
    }
    if (fields[key].isTable) {
      columns.push({
        title: fields[key].chineseName,
        dataIndex: key,
        key: key,
        minWidth: 200,
      });
    }
  });
  columns.push({
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    fixed: "right",
    width: 128,
    className: "table-operation-column",
  });
};

const formattingData = (list) => {
  if (!list || !list.length) return [];
  return list.map((item) => {
    Object.keys(item).forEach((key) => {
      if (["updatedAt", "createdAt"].includes(key)) {
        item[key] = moment(item[key]).format("YYYY-MM-DD HH:mm:ss");
      }
    });
    return item;
  });
};

await loadFields();
await findAll("Route");
</script>

<style lang="scss" scoped>
.module-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.module-page__heading {
  margin-bottom: 24px;
  padding-bottom: 0;
  border-bottom: 0;
}

.module-page__eyebrow {
  color: var(--app-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.module-page__heading h1 {
  margin: 6px 0 7px;
  color: var(--app-ink);
  font-size: 24px;
  font-weight: 700;
}

.module-page__heading p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.module-page__route-table {
  width: 100%;
  margin-bottom: 12px;
}

.module-page__row-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.module-page__cell-text {
  max-width: 240px;
  margin: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
