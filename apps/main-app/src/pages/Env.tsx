import { useMenus, type MenuItem } from "../api/menu";
import { Card, Chip, Table } from "@heroui/react";

type TagColor = "accent" | "success" | "warning" | "danger" | "default";

export default function Env() {
  const menus = useMenus();

  const currentPath = window.location.pathname;
  const ua = navigator.userAgent;
  const language = navigator.language;
  const online = navigator.onLine;

  const pavilionMfeEnv = (import.meta.env.VITE_PAVILION_MFE_ENV || "dev") as string;
  const apiBase = (import.meta.env.VITE_BASE_API_URL || "") as string;
  const cdn = (import.meta.env.VITE_PAVILION_MFE_CDN || "") as string;

  const envTagColor: TagColor =
    pavilionMfeEnv === "production" ? "danger" : pavilionMfeEnv === "uat" ? "warning" : "success";

  const infoCards: { label: string; value: string; color: TagColor }[] = [
    { label: "框架", value: "React 19", color: "success" },
    { label: "构建工具", value: "Vite 8", color: "warning" },
    { label: "微前端", value: "PavilionMfe", color: "accent" }
  ];

  const envRows: { key: string; label: string; value: React.ReactNode; label2?: string; value2?: React.ReactNode }[] = [
    {
      key: "env",
      label: "当前环境",
      value: (
        <Chip color={envTagColor} variant="soft">
          {pavilionMfeEnv}
        </Chip>
      ),
      label2: "API Base",
      value2: apiBase || "-"
    },
    {
      key: "cdn",
      label: "CDN",
      value: cdn || "-"
    }
  ];

  const runtimeRows: {
    key: string;
    label: string;
    value: React.ReactNode;
    label2?: string;
    value2?: React.ReactNode;
  }[] = [
    {
      key: "path",
      label: "当前路径",
      value: currentPath,
      label2: "语言",
      value2: language
    },
    {
      key: "ua",
      label: "User Agent",
      value: <span className="break-all">{ua}</span>
    },
    {
      key: "online",
      label: "在线状态",
      value: online ? "在线" : "离线"
    }
  ];

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-text-primary m-0 mb-6 tracking-[-0.3px]">环境信息</h1>

      <div className="grid grid-cols-3 gap-4 mb-4 max-[900px]:grid-cols-1">
        {infoCards.map(item => (
          <Card key={item.label} variant="default" className="flex flex-row items-center justify-between p-5">
            <div className="text-[13px] font-semibold text-text-muted">{item.label}</div>
            <Chip color={item.color} variant="soft">
              {item.value}
            </Chip>
          </Card>
        ))}
      </div>

      {/* 已注册菜单 */}
      <Card variant="default" className="p-5 mb-4">
        <div className="text-sm font-bold text-text-primary mb-4">已注册菜单</div>
        <Table>
          <Table.ScrollContainer className="overflow-x-auto">
            <Table.Content>
              <Table.Header>
                <Table.Column id="code" isRowHeader>
                  菜单编码
                </Table.Column>
                <Table.Column id="name">菜单名称</Table.Column>
                <Table.Column id="url">路由地址</Table.Column>
                <Table.Column id="type">类型</Table.Column>
                <Table.Column id="status">状态</Table.Column>
              </Table.Header>
              <Table.Body items={menus} dependencies={[]}>
                {(row: MenuItem) => (
                  <Table.Row id={row.menuCode}>
                    <Table.Cell>{row.menuCode}</Table.Cell>
                    <Table.Cell>{row.menuName}</Table.Cell>
                    <Table.Cell>{row.menuUrl}</Table.Cell>
                    <Table.Cell>
                      <Chip color={row.menuTp === "0" ? "accent" : "default"} size="sm" variant="soft">
                        {row.menuTp === "0" ? "目录" : "菜单"}
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip color={row.status === "1" ? "success" : "danger"} size="sm" variant="soft">
                        {row.status === "1" ? "启用" : "禁用"}
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card>

      {/* 环境配置 */}
      <Card variant="default" className="p-5 mb-4">
        <div className="text-sm font-bold text-text-primary mb-4">环境配置</div>
        <Table>
          <Table.Content>
            <Table.Header>
              <Table.Column id="k1" isRowHeader>
                键
              </Table.Column>
              <Table.Column id="v1">值</Table.Column>
              <Table.Column id="k2">键</Table.Column>
              <Table.Column id="v2">值</Table.Column>
            </Table.Header>
            <Table.Body items={envRows}>
              {row => (
                <Table.Row id={row.key}>
                  <Table.Cell className="text-text-muted font-medium whitespace-nowrap">{row.label}</Table.Cell>
                  <Table.Cell>{row.value}</Table.Cell>
                  <Table.Cell className="text-text-muted font-medium whitespace-nowrap">{row.label2 ?? ""}</Table.Cell>
                  <Table.Cell>{row.value2 ?? ""}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table>
      </Card>

      {/* 运行时信息 */}
      <Card variant="default" className="p-5">
        <div className="text-sm font-bold text-text-primary mb-4">运行时信息</div>
        <Table>
          <Table.Content>
            <Table.Header>
              <Table.Column id="k1" isRowHeader>
                键
              </Table.Column>
              <Table.Column id="v1">值</Table.Column>
              <Table.Column id="k2">键</Table.Column>
              <Table.Column id="v2">值</Table.Column>
            </Table.Header>
            <Table.Body items={runtimeRows}>
              {row => (
                <Table.Row id={row.key}>
                  <Table.Cell className="text-text-muted font-medium whitespace-nowrap">{row.label}</Table.Cell>
                  <Table.Cell>{row.value}</Table.Cell>
                  <Table.Cell className="text-text-muted font-medium whitespace-nowrap">{row.label2 ?? ""}</Table.Cell>
                  <Table.Cell>{row.value2 ?? ""}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table>
      </Card>
    </div>
  );
}
