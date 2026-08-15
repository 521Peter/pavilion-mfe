import { navigateTo } from "@pavilion-mfe/router";
import { Button, Card, Table } from "@heroui/react";

const tableData = [
  { id: "path", label: "当前路径", value: window.location.pathname },
  { id: "frame", label: "框架", value: "React 19 + TypeScript" },
  { id: "mfe", label: "微前端", value: "PavilionMfe (Module Federation)" },
  { id: "build", label: "构建工具", value: "Vite 8" }
];

export default function Test() {
  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-text-primary m-0 mb-1.5 tracking-[-0.3px]">测试页</h1>
      <p className="text-sm text-text-regular m-0 mb-6">这是主应用自带的页面，不经过子应用加载。</p>

      <Card variant="default" className="p-5 mb-4">
        <div className="text-sm font-bold text-text-primary mb-4">环境信息</div>
        <Table>
          <Table.Content>
            <Table.Header>
              <Table.Column id="label" isRowHeader>
                项目
              </Table.Column>
              <Table.Column id="value">值</Table.Column>
            </Table.Header>
            <Table.Body items={tableData}>
              {row => (
                <Table.Row id={row.id}>
                  <Table.Cell className="font-medium whitespace-nowrap">{row.label}</Table.Cell>
                  <Table.Cell>{row.value}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table>
      </Card>

      <Card variant="default" className="p-5">
        <div className="text-sm font-bold text-text-primary mb-4">导航测试</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={() => navigateTo("/demo/list")}>
            Vue 列表页
          </Button>
          <Button variant="outline" onPress={() => navigateTo("/demo/form")}>
            Vue 表单页
          </Button>
          <Button variant="primary" onPress={() => navigateTo("/react/list")}>
            React 列表页
          </Button>
          <Button variant="outline" onPress={() => navigateTo("/react/dashboard")}>
            React 仪表盘
          </Button>
        </div>
      </Card>
    </div>
  );
}
