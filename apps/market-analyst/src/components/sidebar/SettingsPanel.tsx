import { Drawer, Button, type DrawerProps } from "@heroui/react";

export function SettingsPanel({ isOpen, onOpenChange }: Partial<DrawerProps>) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog>
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>模型设置</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body></Drawer.Body>
          <Drawer.Footer>
            <Button slot="close">完成</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
